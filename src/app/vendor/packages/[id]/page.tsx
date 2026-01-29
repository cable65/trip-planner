import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { updateVendorPackage, addAvailability, removeAvailability, archivePackage, unarchivePackage } from "../actions";

export default async function VendorPackageDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const pkg = await (prisma as any).vendorPackage.findUnique({
    where: { id },
    include: { availability: { orderBy: { dateFrom: "asc" } } }
  });

  if (!pkg || pkg.vendorId !== userId) notFound();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/vendor/packages" className="rounded-full bg-neutral-800 p-2 text-neutral-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Package</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          {/* Edit Form */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Package Details</h2>
          <form action={updateVendorPackage} className="space-y-4">
            <input type="hidden" name="id" value={pkg.id} />
            <div>
               <label className="text-sm text-neutral-400">Name</label>
               <input name="name" defaultValue={pkg.name} className="w-full rounded bg-neutral-950 px-3 py-2 text-white ring-1 ring-neutral-800" />
            </div>
            <div>
               <label className="text-sm text-neutral-400">Description</label>
               <textarea name="description" rows={4} defaultValue={pkg.description} className="w-full rounded bg-neutral-950 px-3 py-2 text-white ring-1 ring-neutral-800" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-neutral-400">Price (Cents)</label>
                <input name="priceCents" type="number" defaultValue={pkg.priceCents} className="w-full rounded bg-neutral-950 px-3 py-2 text-white ring-1 ring-neutral-800" />
              </div>
              <div>
                <label className="text-sm text-neutral-400">Commission (%)</label>
                <input name="commissionRate" type="number" defaultValue={pkg.commissionRate} className="w-full rounded bg-neutral-950 px-3 py-2 text-white ring-1 ring-neutral-800" />
              </div>
            </div>
            <button className="w-full rounded bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500">
              Save Changes
            </button>
            <p className="text-center text-xs text-neutral-500">Saving changes will reset approval status.</p>
          </form>
          </div>
        
          {/* Danger Zone */}
          <div className="rounded-xl border border-red-900/30 bg-red-900/10 p-6">
            <h2 className="mb-2 text-lg font-semibold text-red-400">Danger Zone</h2>
          <p className="mb-4 text-sm text-neutral-400">
            {pkg.isArchived 
              ? "This package is currently archived. It is hidden from public view and cannot be booked." 
              : "Archiving this package will hide it from public view and prevent new bookings."}
          </p>
          
          <form action={pkg.isArchived ? unarchivePackage : archivePackage}>
            <input type="hidden" name="packageId" value={pkg.id} />
            <button className={`w-full rounded px-4 py-2 font-semibold text-white ${pkg.isArchived ? "bg-neutral-700 hover:bg-neutral-600" : "bg-red-600 hover:bg-red-500"}`}>
              {pkg.isArchived ? "Unarchive Package" : "Archive Package"}
            </button>
          </form>
          </div>
        </div>

        {/* Availability Manager */}
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Availability</h2>
            
            <form action={addAvailability} className="mb-6 space-y-4 rounded bg-neutral-950 p-4">
              <input type="hidden" name="packageId" value={pkg.id} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-neutral-400">From</label>
                  <input type="date" name="dateFrom" required className="w-full rounded bg-neutral-900 px-2 py-1 text-sm text-white ring-1 ring-neutral-800" />
                </div>
                <div>
                  <label className="text-xs text-neutral-400">To</label>
                  <input type="date" name="dateTo" required className="w-full rounded bg-neutral-900 px-2 py-1 text-sm text-white ring-1 ring-neutral-800" />
                </div>
              </div>
              <div>
                 <label className="text-xs text-neutral-400">Quantity / Slots</label>
                 <input type="number" name="quantity" defaultValue="10" className="w-full rounded bg-neutral-900 px-2 py-1 text-sm text-white ring-1 ring-neutral-800" />
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded bg-neutral-800 py-2 text-sm font-semibold text-white hover:bg-neutral-700">
                <Plus className="h-4 w-4" /> Add Range
              </button>
            </form>

            <div className="space-y-2">
              {pkg.availability.length === 0 ? (
                <p className="text-center text-sm text-neutral-500">No availability set.</p>
              ) : (
                pkg.availability.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-950 p-3">
                    <div className="text-sm">
                      <div className="text-white">
                        {new Date(a.dateFrom).toLocaleDateString()} - {new Date(a.dateTo).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-neutral-400">{a.quantity} slots</div>
                    </div>
                    <form action={removeAvailability}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="packageId" value={pkg.id} />
                      <button className="text-neutral-500 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
