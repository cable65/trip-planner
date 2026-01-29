"use client";

import { useTransition } from "react";
import { exportAuditLogs } from "./actions";

function toCsv(rows: Record<string, string>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: string) => {
    const s = v ?? "";
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(String(row[h] ?? ""))).join(","));
  }
  return lines.join("\n");
}

export function ExportButton(props: {
  action?: string;
  actionContains?: string;
  resourceType?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
  resourceId?: string;
  page?: number;
  pageSize?: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const rows = await exportAuditLogs(props);
            const csv = toCsv(rows);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-logs-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          })
        }
        className="rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 disabled:opacity-60"
      >
        {isPending ? "Exporting…" : "Export CSV"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const skip = Math.max(0, ((props.page ?? 1) - 1) * (props.pageSize ?? 50));
            const take = props.pageSize ?? 50;
            const rows = await exportAuditLogs({ ...props, skip, take });
            const csv = toCsv(rows);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-logs-page-${props.page ?? 1}-${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          })
        }
        className="rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 disabled:opacity-60"
      >
        {isPending ? "Exporting…" : "Export Current Page"}
      </button>
    </div>
  );
}

