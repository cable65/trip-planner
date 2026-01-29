import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { appendAuditLog } from "@/lib/audit";
import {
  TripLayoutConfig,
  TripLayoutUpdate,
  hasTripLayoutVersionConflict,
  normalizeTripLayoutConfig,
  applyTripLayoutUpdate
} from "@/lib/trip-layout";
import { z } from "zod";

async function getExistingConfig(): Promise<TripLayoutConfig | null> {
  const row = await (prisma as any).tripUiPreference.findUnique({ where: { id: "default" } });
  if (!row) return null;
  return normalizeTripLayoutConfig({
    version: row.version,
    visibility: row.visibility,
    sequence: row.sequence
  });
}

const UpdateSchema = z.object({
  version: z.number().int().positive().optional(),
  visibility: z
    .object({
      tripFinances: z.boolean().optional(),
      bookings: z.boolean().optional(),
      itineraryLinks: z
        .object({
          showDirections: z.boolean().optional(),
          showMap: z.boolean().optional(),
          showMoreInfo: z.boolean().optional()
        })
        .optional()
    })
    .optional(),
  sequence: z
    .array(
      z.union([
        z.literal("tripFinances"),
        z.literal("regenerate"),
        z.literal("notes"),
        z.literal("bookings"),
        z.literal("vendorQuotes")
      ])
    )
    .optional(),
  resetToDefault: z.boolean().optional()
});

export async function GET() {
  const session = await requireUser();
  const role = (session.user as any).role as string;
  if (role !== "admin") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const config = await getExistingConfig();
    const normalized = config ?? normalizeTripLayoutConfig(null);
    return NextResponse.json({ ok: true, config: normalized });
  } catch (error) {
    console.error("Trip layout GET failed", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Trip layout configuration failed to load. Ensure database migrations are applied for TripUiPreference."
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const role = (session.user as any).role as string;
  if (role !== "admin") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const actorId = (session.user as any).id as string;
  const actorRole = role;

  let parsed: z.infer<typeof UpdateSchema>;
  try {
    const json = await req.json();
    parsed = UpdateSchema.parse(json);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }

  try {
    const existing = await getExistingConfig();
    const clientVersion = parsed.version ?? null;
    const existingVersion = existing?.version ?? null;

    if (hasTripLayoutVersionConflict(existingVersion, clientVersion)) {
      const current = existing ?? normalizeTripLayoutConfig(null);
      return NextResponse.json(
        {
          ok: false,
          reason: "version_conflict",
          message: "Trip layout was updated by another administrator.",
          config: current
        },
        { status: 409 }
      );
    }

    const update: TripLayoutUpdate = {
      visibility: parsed.visibility
        ? {
            tripFinances: parsed.visibility.tripFinances,
            bookings: parsed.visibility.bookings,
            itineraryLinks: parsed.visibility.itineraryLinks
              ? {
                  showDirections: parsed.visibility.itineraryLinks.showDirections,
                  showMap: parsed.visibility.itineraryLinks.showMap,
                  showMoreInfo: parsed.visibility.itineraryLinks.showMoreInfo
                }
              : undefined
          }
        : undefined,
      sequence: parsed.sequence,
      resetToDefault: parsed.resetToDefault
    };

    const next = applyTripLayoutUpdate(existing ?? null, update);

    const row = await (prisma as any).tripUiPreference.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        visibility: next.visibility as any,
        sequence: next.sequence as any,
        version: next.version
      },
      update: {
        visibility: next.visibility as any,
        sequence: next.sequence as any,
        version: next.version
      }
    });

    await appendAuditLog({
      actorId,
      actorRole,
      action: parsed.resetToDefault
        ? "ADMIN_TRIP_LAYOUT_RESET"
        : existing
        ? "ADMIN_TRIP_LAYOUT_UPDATED"
        : "ADMIN_TRIP_LAYOUT_CREATED",
      resourceType: "TripUiPreference",
      resourceId: row.id,
      oldValue: existing,
      newValue: next,
      metadata: {
        apiRoute: "admin/trip-layout"
      }
    });

    return NextResponse.json({ ok: true, config: next });
  } catch (error) {
    console.error("Trip layout POST failed", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Trip layout configuration failed to save. Ensure database migrations are applied for TripUiPreference."
      },
      { status: 500 }
    );
  }
}

