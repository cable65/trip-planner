"use client";

import { useEffect, useState } from "react";

export function ProgressBar({ indeterminate = false, value = 0 }: { indeterminate?: boolean; value?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed left-0 top-0 z-50 h-1 w-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={indeterminate ? undefined : value}>
      <div
        className={`h-full bg-indigo-500 transition-all ${indeterminate ? "animate-pulse" : ""}`}
        style={{ width: indeterminate ? "100%" : `${value}%` }}
      />
    </div>
  );
}

