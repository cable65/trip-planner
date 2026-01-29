import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { appendAuditLog } from "@/lib/audit";

export async function POST() {
  const h = await headers();
  const authHeader = h.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "dev-cron-secret";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find active campaigns
  const activeCampaigns = await (prisma as any).campaign.findMany({
    where: { status: "sending" },
    include: { metrics: true }
  });

  const results = {
    scanned: activeCampaigns.length,
    paused: 0,
    details: [] as string[]
  };

  for (const campaign of activeCampaigns) {
    const m = campaign.metrics;
    if (!m) continue;

    const cost = m.costCents || 0;
    const revenue = m.revenueCents || 0;
    
    // Thresholds:
    // 1. Minimum spend to qualify: $50 (5000 cents)
    // 2. ROAS < 1.0 (Losing money)
    if (cost > 5000 && revenue < cost) {
      // Pause campaign
      await (prisma as any).campaign.update({
        where: { id: campaign.id },
        data: { status: "paused" }
      });

      // Audit Log
      await appendAuditLog({
        actorId: "SYSTEM",
        actorRole: "system",
        action: "CAMPAIGN_AUTO_PAUSED",
        resourceType: "Campaign",
        resourceId: campaign.id,
        oldValue: { status: "sending", cost, revenue },
        newValue: { status: "paused" },
        metadata: { reason: "Low ROAS", roas: revenue / cost }
      });

      results.paused++;
      results.details.push(`Paused campaign ${campaign.id}: Spent $${cost/100}, Rev $${revenue/100}`);
    }
  }

  return NextResponse.json(results);
}
