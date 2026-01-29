"use client";

import { useEffect } from "react";

export default function TrackView({ vendorId }: { vendorId: string }) {
  useEffect(() => {
    fetch(`/api/vendors/${vendorId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "view" })
    }).catch(() => {});
  }, [vendorId]);
  return null;
}

