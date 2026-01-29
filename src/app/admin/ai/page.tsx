import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { format } from "date-fns";
import { Download } from "lucide-react";

export default async function AdminAiPage() {
  await requireAdmin();

  const logs = await prisma.aiImageLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true } } }
  });

  const totalCostCents = await prisma.aiImageLog.aggregate({
    _sum: { costCents: true }
  });

  const totalGenerated = await prisma.aiImageLog.count();
  const cachedCount = await prisma.aiImageLog.count({ where: { cached: true } });
  const totalCost = (totalCostCents._sum.costCents || 0) / 100;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">AI Usage Analytics</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="text-sm text-neutral-400">Total Cost</div>
          <div className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="text-sm text-neutral-400">Images Generated</div>
          <div className="text-2xl font-bold text-white">{totalGenerated}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="text-sm text-neutral-400">Cached Re-use</div>
          <div className="text-2xl font-bold text-emerald-400">{cachedCount}</div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-800 text-neutral-400">
            <tr>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Prompt</th>
              <th className="px-6 py-3 font-medium">Cost</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 text-neutral-300">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-neutral-800/50">
                <td className="px-6 py-3 whitespace-nowrap">
                  {format(log.createdAt, "MMM d, HH:mm")}
                </td>
                <td className="px-6 py-3">{log.user?.email || "System"}</td>
                <td className="px-6 py-3 max-w-xs truncate" title={log.prompt}>
                  {log.prompt}
                </td>
                <td className="px-6 py-3">
                  ${(log.costCents / 100).toFixed(2)}
                </td>
                <td className="px-6 py-3">
                  {log.cached ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-1 text-xs font-medium text-emerald-400">
                      Cached
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-indigo-400/10 px-2 py-1 text-xs font-medium text-indigo-400">
                      Generated
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
