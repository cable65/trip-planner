"use client";

export default function ErrorVendorProfile({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8" role="alert">
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-red-200">
        <h2 className="text-xl font-bold">Failed to load vendor profile</h2>
        <p className="text-sm">{error.message}</p>
        <button
          className="mt-4 rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
          onClick={reset}
          aria-label="Retry loading"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

