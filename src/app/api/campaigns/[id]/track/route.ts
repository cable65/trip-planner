import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const BodySchema = z.object({
    event: z.enum(["view", "engage", "click", "convert"]).default("view"),
    variantId: z.string().optional(),
    costCents: z.coerce.number().int().min(0).optional(),
    revenueCents: z.coerce.number().int().min(0).optional()
  });
  const raw = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(raw);
  const event = parsed.success ? parsed.data.event : "view";
  const variantId = parsed.success ? parsed.data.variantId : undefined;
  const costCents = parsed.success ? parsed.data.costCents ?? 0 : 0;
  const revenueCents = parsed.success ? parsed.data.revenueCents ?? 0 : 0;

  try {
    if (variantId) {
      await (prisma as any).variationMetric.upsert({
        where: { variationId: variantId },
        update: {
          views: { increment: event === "view" ? 1 : 0 },
          engagements: { increment: event === "engage" ? 1 : 0 },
          clicks: { increment: event === "click" ? 1 : 0 },
          conversions: { increment: event === "convert" ? 1 : 0 },
          costCents: { increment: costCents },
          revenueCents: { increment: revenueCents }
        },
        create: {
          variationId: variantId,
          views: event === "view" ? 1 : 0,
          engagements: event === "engage" ? 1 : 0,
          clicks: event === "click" ? 1 : 0,
          conversions: event === "convert" ? 1 : 0,
          costCents,
          revenueCents
        }
      });
    } else {
      await (prisma as any).campaignMetric.upsert({
        where: { campaignId: id },
        update: {
          views: { increment: event === "view" ? 1 : 0 },
          engagements: { increment: event === "engage" ? 1 : 0 },
          clicks: { increment: event === "click" ? 1 : 0 },
          conversions: { increment: event === "convert" ? 1 : 0 },
          costCents: { increment: costCents },
          revenueCents: { increment: revenueCents }
        },
        create: {
          campaignId: id,
          views: event === "view" ? 1 : 0,
          engagements: event === "engage" ? 1 : 0,
          clicks: event === "click" ? 1 : 0,
          conversions: event === "convert" ? 1 : 0,
          costCents,
          revenueCents
        }
      });
    }

    await appendAuditLog({
      actorId: null,
      actorRole: null,
      action: `CAMPAIGN_EVENT_${event.toUpperCase()}`,
      resourceType: "Campaign",
      resourceId: id,
      metadata: { source: "api", route: "campaigns.track", event, variantId, costCents, revenueCents }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

