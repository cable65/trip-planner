import { ProgressBar } from "./progress-bar";

export default function LoadingVendorProfile() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8" aria-busy="true" aria-live="polite">
      <ProgressBar indeterminate />
      <div className="h-48 w-full animate-pulse rounded-xl bg-neutral-900" />
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-neutral-900" />
        <div className="space-y-2">
          <div className="h-5 w-48 animate-pulse rounded bg-neutral-900" />
          <div className="h-4 w-64 animate-pulse rounded bg-neutral-900" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-5 w-32 animate-pulse rounded bg-neutral-900" />
        <div className="h-24 w-full animate-pulse rounded bg-neutral-900" />
      </div>
    </div>
  );
}

