"use client";

export function StatusFilter({ defaultStatus }: { defaultStatus?: string }) {
  return (
    <form className="mb-4 flex items-center gap-2 text-sm">
      <label className="text-neutral-400" htmlFor="status-select">Status</label>
      <select
        id="status-select"
        name="status"
        defaultValue={defaultStatus ?? ""}
        className="rounded bg-neutral-950 px-2 py-1 text-xs ring-1 ring-neutral-800"
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          const v = e.target.value;
          if (v) params.set("status", v); else params.delete("status");
          window.location.search = params.toString();
        }}
      >
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="refunded">Refunded</option>
      </select>
    </form>
  );
}

