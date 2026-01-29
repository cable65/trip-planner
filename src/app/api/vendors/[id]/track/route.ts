import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const BodySchema = z.object({ event: z.enum(["view", "engage", "convert"]).default("view") });
  const raw = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(raw);
  const event = parsed.success ? parsed.data.event : "view";

  try {
    await prisma.profileMetric.upsert({
      where: { vendorId: id },
      update: {
        views: { increment: event === "view" ? 1 : 0 },
        engagements: { increment: event === "engage" ? 1 : 0 },
        conversions: { increment: event === "convert" ? 1 : 0 }
      },
      create: {
        vendorId: id,
        views: event === "view" ? 1 : 0,
        engagements: event === "engage" ? 1 : 0,
        conversions: event === "convert" ? 1 : 0
      }
    });

    await appendAuditLog({
      actorId: null,
      actorRole: null,
      action: `VENDOR_PROFILE_EVENT_${event.toUpperCase()}`,
      resourceType: "Vendor",
      resourceId: id,
      metadata: { source: "api", route: "vendors.track", event }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

