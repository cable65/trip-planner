"use client";

import { useState } from "react";

export function LogDetailsButton({ log }: { log: any }) {
  const [open, setOpen] = useState(false);
  const json = {
    oldValue: log.oldValue ?? null,
    newValue: log.newValue ?? null,
    metadata: log.metadata ?? {}
  };
  const pretty = JSON.stringify(json, null, 2);

  return (
    <>
      <button
        type="button"
        className="rounded bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700"
        onClick={() => setOpen(true)}
      >
        View
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-[90vw] max-w-3xl rounded-lg border border-neutral-800 bg-neutral-900 shadow">
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
              <div className="text-sm font-semibold">Audit Details</div>
              <button className="rounded bg-neutral-800 px-2 py-1 text-xs hover:bg-neutral-700" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-4">
              <pre className="whitespace-pre-wrap break-words text-xs text-neutral-200">{pretty}</pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

