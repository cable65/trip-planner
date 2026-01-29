import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSuggestions } from "@/lib/analytics/campaign-suggestions";
import { requireUser } from "@/lib/require-auth";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const role = (session.user as any).role as string;
  if (role !== "vendor" && role !== "admin") return NextResponse.json({ ok: false }, { status: 403 });
  const { id } = await ctx.params;

  const metric = await prisma.campaignMetric.findUnique({ where: { campaignId: id } });
  if (!metric) return NextResponse.json({ ok: false, message: "No metrics" }, { status: 404 });

  const data = computeSuggestions({
    views: metric.views,
    engagements: (metric as any).engagements ?? 0,
    clicks: metric.clicks,
    conversions: metric.conversions,
    costCents: (metric as any).costCents ?? 0,
    revenueCents: (metric as any).revenueCents ?? 0
  });

  return NextResponse.json({ ok: true, ...data });
}

