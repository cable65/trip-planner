"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";

interface Package {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  media: any;
  vendor: {
    name: string;
    vendorProfile: {
      location: string;
      logoUrl: string | null;
    };
  };
}

export function RecommendedPackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPackages(data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-40 bg-neutral-900 rounded-xl"></div>;
  if (packages.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Recommended for You</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/packages/${pkg.id}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition hover:border-neutral-700"
          >
            <div className="relative h-40 w-full bg-neutral-800">
               {/* Placeholder for image if media exists */}
               {pkg.media && pkg.media.length > 0 && typeof pkg.media[0] === 'string' ? (
                  <img src={pkg.media[0]} alt={pkg.name} className="h-full w-full object-cover" />
               ) : (
                  <div className="flex h-full items-center justify-center text-neutral-600">
                    No Image
                  </div>
               )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-2 text-xs text-indigo-400">
                 {pkg.vendor.vendorProfile?.location || "Experience"}
              </div>
              <h3 className="mb-1 text-lg font-semibold text-white group-hover:text-indigo-400">
                {pkg.name}
              </h3>
              <p className="line-clamp-2 text-sm text-neutral-400 mb-4 flex-1">
                {pkg.description}
              </p>
              <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                <div className="text-xs text-neutral-500">By {pkg.vendor.name}</div>
                <div className="font-semibold text-emerald-400">
                  {formatCurrency({ amount: pkg.priceCents / 100 })}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
