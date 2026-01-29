"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";

type Vendor = {
  id: string;
  name: string | null;
  vendorProfile: {
    intro: string | null;
    bannerUrl: string | null;
    logoUrl: string | null;
  } | null;
};

export function VendorSelectionForm({
  tripId,
  vendors,
  action
}: {
  tripId: string;
  vendors: Vendor[];
  action: (formData: FormData) => Promise<any>;
}) {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [expiry, setExpiry] = useState(format(addDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm"));

  const toggleVendor = (id: string) => {
    if (selectedVendors.includes(id)) {
      setSelectedVendors(selectedVendors.filter((v) => v !== id));
    } else {
      setSelectedVendors([...selectedVendors, id]);
    }
  };

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="vendorIds" value={selectedVendors.join(",")} />
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-neutral-300">Quote Expiry Date</label>
        <input
          type="datetime-local"
          name="expiresAt"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="block w-full rounded bg-neutral-950 px-3 py-2 text-sm text-white ring-1 ring-neutral-800"
          required
        />
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-neutral-300">Available Vendors</label>
        {vendors.length === 0 ? (
          <p className="text-sm text-neutral-500">No vendors available at the moment.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                onClick={() => toggleVendor(vendor.id)}
                className={`cursor-pointer rounded-lg border p-4 transition ${
                  selectedVendors.includes(vendor.id)
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800">
                    {vendor.vendorProfile?.logoUrl ? (
                      <img src={vendor.vendorProfile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                        {vendor.name?.charAt(0) || "V"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{vendor.name || "Unknown Vendor"}</h3>
                    <p className="line-clamp-1 text-xs text-neutral-400">
                      {vendor.vendorProfile?.intro || "No introduction provided."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={selectedVendors.length === 0}
        className="w-full rounded bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Request Quotes ({selectedVendors.length})
      </button>
    </form>
  );
}
