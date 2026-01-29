"use client";

export function CopyLinkButton({ url }: { url: string }) {
  return (
    <button
      className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {}
      }}
    >
      Copy Link
    </button>
  );
}

