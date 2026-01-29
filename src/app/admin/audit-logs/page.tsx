import { auditPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-auth";
import { ExportButton } from "./export-button";
import { LogDetailsButton } from "./log-details-button";

export default async function AuditLogsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const sp = await searchParams;
  const action = typeof sp.action === "string" ? sp.action : undefined;
  const actionContains = typeof sp.actionContains === "string" ? sp.actionContains : undefined;
  const resourceType = typeof sp.resourceType === "string" ? sp.resourceType : undefined;
  const actorId = typeof sp.actorId === "string" ? sp.actorId : undefined;
  const dateFrom = typeof sp.dateFrom === "string" ? sp.dateFrom : undefined;
  const dateTo = typeof sp.dateTo === "string" ? sp.dateTo : undefined;
  const resourceId = typeof sp.resourceId === "string" ? sp.resourceId : undefined;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const pageSize = 50;

  const where: any = {};
  if (action) where.action = action;
  else if (actionContains) where.action = { contains: actionContains, mode: "insensitive" };
  if (resourceType) where.resourceType = resourceType;
  if (actorId) where.actorId = actorId;
  if (resourceId) where.resourceId = resourceId;
  if (dateFrom || dateTo) {
    where.timestamp = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {})
    };
  }

  const [total, logs] = await Promise.all([
    auditPrisma.auditLog.count({ where }),
    auditPrisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <div className="flex items-center gap-2">
          <a
            href="?action=ITINERARY_LINK_CLICKED&resourceType=Trip"
            className="rounded bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-100 hover:bg-neutral-700"
          >
            Itinerary link clicks
          </a>
          <ExportButton action={action} actionContains={actionContains} resourceType={resourceType} actorId={actorId} dateFrom={dateFrom} dateTo={dateTo} resourceId={resourceId} page={page} pageSize={pageSize} />
        </div>
      </div>

      <form className="grid grid-cols-1 gap-3 rounded border border-neutral-800 p-4 md:grid-cols-6">
        <input
          name="action"
          defaultValue={action}
          placeholder="Action"
          className="rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
        />
        <input
          name="actionContains"
          defaultValue={actionContains}
          placeholder="Action contains"
          className="rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
        />
        <input
          name="resourceType"
          defaultValue={resourceType}
          placeholder="Resource type"
          className="rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
        />
        <input
          name="actorId"
          defaultValue={actorId}
          placeholder="Actor ID"
          className="rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
        />
        <input
          name="resourceId"
          defaultValue={resourceId}
          placeholder="Resource ID"
          className="rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
        />
        <input
          type="date"
          name="dateFrom"
          defaultValue={dateFrom}
          placeholder="From"
          className="rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
        />
        <input
          type="date"
          name="dateTo"
          defaultValue={dateTo}
          placeholder="To"
          className="rounded bg-neutral-900 px-3 py-2 text-sm ring-1 ring-neutral-800"
        />
        <button className="rounded bg-indigo-600 px-3 py-2 text-sm hover:bg-indigo-500">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Resource</th>
              <th className="px-3 py-2">IP</th>
              <th className="px-3 py-2">User Agent</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-neutral-800">
                <td className="px-3 py-2 whitespace-nowrap text-neutral-300">
                  {l.timestamp.toISOString()}
                </td>
                <td className="px-3 py-2 font-medium">{l.action}</td>
                <td className="px-3 py-2 text-neutral-300">
                  {l.actorId ?? ""} {l.actorRole ? `(${l.actorRole})` : ""}
                </td>
                <td className="px-3 py-2 text-neutral-300">
                  {l.resourceType} {l.resourceId ?? ""}
                </td>
                <td className="px-3 py-2 text-neutral-300">{l.ipAddress ?? ""}</td>
                <td className="px-3 py-2 truncate text-neutral-300 max-w-[240px]">{l.userAgent ?? ""}</td>
                <td className="px-3 py-2"><LogDetailsButton log={l} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-300">
        <div>
          Page {page} / {totalPages} ({total} rows)
        </div>
        <div className="flex gap-2">
          <a
            className={`rounded px-3 py-1 ring-1 ring-neutral-800 ${
              page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-neutral-900"
            }`}
            href={`?${new URLSearchParams({
              ...(action ? { action } : {}),
              ...(resourceType ? { resourceType } : {}),
              ...(actorId ? { actorId } : {}),
              page: String(Math.max(1, page - 1))
            }).toString()}`}
          >
            Prev
          </a>
          <a
            className={`rounded px-3 py-1 ring-1 ring-neutral-800 ${
              page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-neutral-900"
            }`}
            href={`?${new URLSearchParams({
              ...(action ? { action } : {}),
              ...(resourceType ? { resourceType } : {}),
              ...(actorId ? { actorId } : {}),
              page: String(Math.min(totalPages, page + 1))
            }).toString()}`}
          >
            Next
          </a>
        </div>
      </div>
    </div>
  );
}

