import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { createCampaign, cancelCampaign } from "./actions";

export default async function VendorCampaignsPage() {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  if (role !== "vendor") return <div>Unauthorized</div>;

  const campaigns = await prisma.campaign.findMany({
    where: { vendorId: userId },
    orderBy: { createdAt: "desc" }
  });

  async function createCampaignAction(formData: FormData) {
    "use server";
    await createCampaign(formData);
  }

  async function cancelCampaignAction(formData: FormData) {
    "use server";
    await cancelCampaign(formData);
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case "sending": return "text-emerald-400";
      case "paused": return "text-amber-400";
      case "cancelled": return "text-red-400";
      case "scheduled": return "text-blue-400";
      default: return "text-neutral-500";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Marketing Campaigns</h1>
        <Link href="/vendor/dashboard" className="rounded bg-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-700">Back</Link>
      </div>

      <form action={createCampaignAction} className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold text-white">Create Campaign</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-neutral-400" htmlFor="name">Name</label>
            <input id="name" name="name" required className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-400" htmlFor="subject">Subject</label>
            <input id="subject" name="subject" required className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-neutral-400" htmlFor="content">Content</label>
            <textarea id="content" name="content" rows={4} required className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-400" htmlFor="scheduledAt">Schedule (optional)</label>
            <input id="scheduledAt" name="scheduledAt" type="datetime-local" className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-neutral-400" htmlFor="target">Target (JSON)</label>
            <input id="target" name="target" placeholder='{"segment":"past_buyers"}' className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800" />
          </div>
        </div>
        <button className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Create</button>
      </form>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900">
        <div className="border-b border-neutral-800 p-4">
          <h2 className="text-lg font-semibold text-white">Your Campaigns</h2>
        </div>
        {campaigns.length === 0 ? (
          <div className="p-6 text-center text-neutral-400">No campaigns yet.</div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold text-white">{c.name}</div>
                  <div className="text-xs text-neutral-400">{c.subject}</div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className={`font-medium capitalize ${getStatusColor(c.status)}`}>{c.status}</span>
                    {c.scheduledAt && <span>• Scheduled {new Date(c.scheduledAt).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/vendor/campaigns/${c.id}`}
                    className="rounded bg-neutral-800 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
                  >
                    Manage
                  </Link>
                  {c.status !== "cancelled" && (
                    <form action={cancelCampaignAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="rounded bg-red-600/10 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/20">
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

