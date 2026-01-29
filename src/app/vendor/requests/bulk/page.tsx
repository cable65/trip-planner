import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { bulkSubmitQuotes } from "./actions";

export default async function BulkRespondPage() {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  if (role !== "vendor") return <div>Unauthorized</div>;

  const shares = await prisma.tripShare.findMany({
    where: { vendorId: userId, status: "PENDING", expiresAt: { gt: new Date() } },
    include: { trip: { select: { destination: true, startDate: true, endDate: true, budget: true } } },
    orderBy: { createdAt: "desc" }
  });

  async function bulkSubmitQuotesAction(formData: FormData) {
    "use server";
    await bulkSubmitQuotes(formData);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Bulk Respond to Requests</h1>
        <Link href="/vendor/dashboard" className="rounded bg-neutral-800 px-3 py-2 text-sm text-white hover:bg-neutral-700">Back</Link>
      </div>

      {shares.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">No pending requests.</div>
        ) : (
          <form action={bulkSubmitQuotesAction} className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <input type="hidden" name="shareIds" value={shares.map((s) => s.id).join(",")} />

          <div className="rounded border border-neutral-800">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-neutral-400">
                  <th className="p-2">Destination</th>
                  <th className="p-2">Dates</th>
                  <th className="p-2">Budget</th>
                </tr>
              </thead>
              <tbody>
                {shares.map((s) => (
                  <tr key={s.id} className="border-t border-neutral-800">
                    <td className="p-2">{s.trip.destination}</td>
                    <td className="p-2">{s.trip.startDate.toISOString().slice(0,10)} → {s.trip.endDate.toISOString().slice(0,10)}</td>
                    <td className="p-2">{s.trip.budget ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-neutral-400" htmlFor="price">Price</label>
              <input id="price" name="price" type="number" min={1} required className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-400" htmlFor="currency">Currency</label>
              <input id="currency" name="currency" defaultValue="USD" className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800" />
            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-xs text-neutral-400" htmlFor="notes">Notes (optional)</label>
              <textarea id="notes" name="notes" rows={3} className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800" />
            </div>
          </div>

          <button className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Submit quotes for all</button>
        </form>
      )}
    </div>
  );
}

