import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Trash2, TrendingUp, Users, MousePointer, DollarSign, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { createVariation, deleteVariation } from "../actions";
import { computeSuggestions } from "@/lib/analytics/campaign-suggestions";

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      metrics: true,
      variations: {
        include: { metrics: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!campaign || campaign.vendorId !== userId) notFound();

  // Compute suggestions
  const { suggestions: suggestionStrings } = computeSuggestions({
    views: campaign.metrics?.views ?? 0,
    clicks: campaign.metrics?.clicks ?? 0,
    conversions: campaign.metrics?.conversions ?? 0,
    engagements: campaign.metrics?.engagements ?? 0,
    costCents: campaign.metrics?.costCents ?? 0,
    revenueCents: campaign.metrics?.revenueCents ?? 0
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/campaigns"
          className="rounded-full bg-neutral-800 p-2 text-neutral-400 transition hover:bg-neutral-700 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
          <p className="text-neutral-400">{campaign.subject} • <span className="capitalize">{campaign.status}</span></p>
        </div>
      </div>

      {/* Paused Alert */}
      {campaign.status === "paused" && (
        <div className="flex items-start gap-4 rounded-xl border border-amber-900/50 bg-amber-900/20 p-4 text-amber-200">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
          <div>
            <h3 className="font-semibold">Campaign Automatically Paused</h3>
            <p className="text-sm text-amber-200/80">
              This campaign was paused because its Return on Ad Spend (ROAS) fell below the threshold of 1.0 while exceeding the minimum spend limit. 
              Review your targeting and content before resuming.
            </p>
          </div>
        </div>
      )}

      {/* Main Metrics Dashboard */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Views"
          value={campaign.metrics?.views ?? 0}
          icon={Users}
          color="text-blue-400"
        />
        <MetricCard
          label="Clicks"
          value={campaign.metrics?.clicks ?? 0}
          icon={MousePointer}
          color="text-purple-400"
        />
        <MetricCard
          label="Conversions"
          value={campaign.metrics?.conversions ?? 0}
          icon={TrendingUp}
          color="text-emerald-400"
        />
        <MetricCard
          label="Revenue"
          value={`$${((campaign.metrics?.revenueCents ?? 0) / 100).toFixed(2)}`}
          icon={DollarSign}
          color="text-amber-400"
        />
      </div>

      {/* AI Suggestions */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Optimization Suggestions</h2>
        {suggestionStrings.length === 0 ? (
          <p className="text-neutral-500">No suggestions available yet. Collect more data!</p>
        ) : (
          <div className="space-y-3">
            {suggestionStrings.map((msg, idx) => (
              <div key={idx} className="flex gap-3 rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="font-medium text-white">{msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* A/B Testing Variations */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">A/B Test Variations</h2>
        </div>

        {/* Create Variation Form */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h3 className="mb-4 font-semibold text-white">Add New Variation</h3>
          <form action={createVariation} className="flex flex-col gap-4 md:flex-row md:items-end">
            <input type="hidden" name="campaignId" value={campaign.id} />
            <div className="flex-1 space-y-1">
              <label className="text-xs text-neutral-400">Name</label>
              <input
                name="name"
                placeholder="e.g. Variant B - Short Subject"
                required
                className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800"
              />
            </div>
            <div className="flex-[2] space-y-1">
              <label className="text-xs text-neutral-400">Content / Subject</label>
              <input
                name="content"
                placeholder="Different content to test..."
                required
                className="w-full rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800"
              />
            </div>
            <button className="flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>
        </div>

        {/* Variations List */}
        <div className="grid gap-4">
          {campaign.variations.length === 0 ? (
            <p className="text-center text-neutral-500">No variations created yet. The main campaign content is used by default.</p>
          ) : (
            campaign.variations.map((v) => (
              <div key={v.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{v.name}</h3>
                    <p className="mt-1 text-sm text-neutral-400">{v.content}</p>
                  </div>
                  <form action={deleteVariation}>
                    <input type="hidden" name="variationId" value={v.id} />
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <button className="text-neutral-500 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4 text-sm sm:grid-cols-4">
                   <div>
                     <span className="block text-neutral-500">Views</span>
                     <span className="font-medium text-white">{v.metrics?.views ?? 0}</span>
                   </div>
                   <div>
                     <span className="block text-neutral-500">Clicks</span>
                     <span className="font-medium text-white">{v.metrics?.clicks ?? 0}</span>
                   </div>
                   <div>
                     <span className="block text-neutral-500">Conversions</span>
                     <span className="font-medium text-white">{v.metrics?.conversions ?? 0}</span>
                   </div>
                   <div>
                     <span className="block text-neutral-500">CTR</span>
                     <span className="font-medium text-emerald-400">
                       {v.metrics?.views ? ((v.metrics.clicks / v.metrics.views) * 100).toFixed(1) : "0.0"}%
                     </span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
