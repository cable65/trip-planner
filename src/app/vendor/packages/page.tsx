import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";

export default async function VendorPackagesPage() {
  const session = await requireUser();
  const role = (session.user as any).role as string;
  const vendorId = (session.user as any).id as string;
  if (role !== "vendor") return null;

  const activePackages = await (prisma as any).vendorPackage.findMany({
    where: { vendorId, isArchived: false },
    orderBy: { updatedAt: "desc" }
  });

  const archivedPackages = await (prisma as any).vendorPackage.findMany({
    where: { vendorId, isArchived: true },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Active Packages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">My Trip Packages</h1>
          <Link href="/vendor/packages/new" className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">New Package</Link>
        </div>

        {activePackages.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">No active packages.</div>
        ) : (
          <div className="grid gap-4">
            {activePackages.map((p: any) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </div>
        )}
      </div>

      {/* Archived Packages */}
      {archivedPackages.length > 0 && (
        <div className="space-y-4 border-t border-neutral-800 pt-8">
          <h2 className="text-lg font-semibold text-neutral-400">Archived</h2>
          <div className="grid gap-4 opacity-75">
            {archivedPackages.map((p: any) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: any }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/vendor/packages/${pkg.id}`} className="font-semibold text-white hover:underline">
              {pkg.name}
            </Link>
            {pkg.isArchived && (
              <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
                Archived
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-400">Price: ${(pkg.priceCents / 100).toFixed(2)}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-xs ${pkg.isApproved ? "text-emerald-400" : "text-amber-400"}`}>
            {pkg.isApproved ? "Approved" : "Pending review"}
          </div>
          <Link href={`/vendor/packages/${pkg.id}`} className="rounded border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white">
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}

