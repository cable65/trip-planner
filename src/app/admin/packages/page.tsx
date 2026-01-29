import { requireAdmin } from "@/lib/require-auth";
import { prisma } from "@/lib/prisma";
import { approvePackage, rejectPackage } from "./actions";
import Link from "next/link";

export default async function AdminPackagesPage() {
  await requireAdmin();

  const packages = await (prisma as any).vendorPackage.findMany({
    include: {
      vendor: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const pending = packages.filter((p: any) => !p.isApproved);
  const approved = packages.filter((p: any) => p.isApproved);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Package Review</h1>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-amber-400">Pending Review ({pending.length})</h2>
          {pending.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-500">
              No pending packages.
            </div>
          ) : (
            <div className="grid gap-4">
              {pending.map((pkg: any) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-emerald-400">Approved Packages ({approved.length})</h2>
          {approved.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-500">
              No approved packages.
            </div>
          ) : (
            <div className="grid gap-4">
              {approved.map((pkg: any) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: any }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link href={`/packages/${pkg.id}`} className="font-semibold text-white hover:underline">
            {pkg.name}
          </Link>
          <span className="text-xs text-neutral-500">ID: {pkg.id}</span>
        </div>
        <div className="text-sm text-neutral-400">
          Vendor: <span className="text-white">{pkg.vendor.name}</span> ({pkg.vendor.email})
        </div>
        <div className="text-sm text-neutral-400">
          Price: ${(pkg.priceCents / 100).toLocaleString()} • Commission: {pkg.commissionRate}%
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!pkg.isApproved ? (
          <form action={approvePackage}>
            <input type="hidden" name="packageId" value={pkg.id} />
            <button className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
              Approve
            </button>
          </form>
        ) : (
          <form action={rejectPackage}>
            <input type="hidden" name="packageId" value={pkg.id} />
            <button className="rounded bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/20">
              Revoke
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
