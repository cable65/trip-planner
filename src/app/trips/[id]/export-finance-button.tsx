"use client";

import { useTransition } from "react";
import { exportTripFinance } from "./actions";

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

export function ExportFinanceButton(props: { tripId: string; status?: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const rows = await exportTripFinance({ tripId: props.tripId, status: props.status });
          const csv = toCsv(rows);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `trip-${props.tripId}-finance-${Date.now()}.csv`;
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
  );
}

