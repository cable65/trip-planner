"use client";

import { useEffect } from "react";

export function PackageTracker({ packageId }: { packageId: string }) {
  useEffect(() => {
    // Fire and forget
    fetch(`/api/packages/${packageId}/track`, {
      method: "POST",
    }).catch(() => {});
  }, [packageId]);

  return null;
}
