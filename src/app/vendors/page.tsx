import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";

export default async function VendorsDirectory({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const session = await requireUser();
  const travelerId = (session.user as any).id as string;

  const sp = searchParams ? await searchParams : undefined;
  const location = sp?.location || "";
  const category = sp?.category || "";
  const sort = sp?.sort || "recommended";

  const allVendors = await prisma.user.findMany({
    where: { role: "vendor" },
    include: { vendorProfile: true }
  });

  const vendorIds = allVendors.map(v => v.id);
  const servicesByVendor = await prisma.booking.groupBy({
    by: ["vendorId", "type"],
    where: { vendorId: { in: vendorIds }, status: "confirmed" },
    _count: { _all: true }
  });

  const reviews = await prisma.review.findMany({
    where: { targetType: "Vendor", targetId: { in: vendorIds } }
  });

  // Fetch some featured packages
  const featuredPackages = await (prisma as any).vendorPackage.findMany({
    where: { isApproved: true },
    take: 6,
    include: {
      vendor: {
        select: {
          name: true,
          vendorProfile: { select: { location: true } }
        }
      }
    }
  });

  const latestTrip = await prisma.trip.findFirst({
    where: { userId: travelerId },
    orderBy: { createdAt: "desc" }
  });

  const servicesMap = new Map<string, { type: string; count: number }[]>();
  for (const s of servicesByVendor) {
    const arr = servicesMap.get(s.vendorId as string) || [];
    arr.push({ type: s.type as string, count: s._count._all });
    servicesMap.set(s.vendorId as string, arr);
  }

  const ratingMap = new Map<string, number>();
  for (const r of reviews) {
    const prev = ratingMap.get(r.targetId) || 0;
    ratingMap.set(r.targetId, prev + r.rating);
  }
  const countMap = new Map<string, number>();
  for (const r of reviews) {
    const prev = countMap.get(r.targetId) || 0;
    countMap.set(r.targetId, prev + 1);
  }

  let vendors = allVendors
    .filter(v => !location || (v.vendorProfile?.location || "").toLowerCase().includes(location.toLowerCase()))
    .filter(v => !category || (servicesMap.get(v.id)?.some(s => s.type.toLowerCase().includes(category.toLowerCase()))))
    .map(v => {
      const total = ratingMap.get(v.id) || 0;
      const count = countMap.get(v.id) || 0;
      const avg = count ? Math.round((total / count) * 10) / 10 : null;
      const intro = (v.vendorProfile?.intro || "").toLowerCase();
      const loc = (v.vendorProfile?.location || "").toLowerCase();
      let score = 0;
      if (latestTrip) {
        const dest = latestTrip.destination.toLowerCase();
        if (loc.includes(dest)) score += 2;
        const interests = (latestTrip.interests || []).map(i => i.toLowerCase());
        for (const i of interests) {
          if (intro.includes(i)) score += 1;
        }
        const style = (latestTrip.travelStyle || "").toLowerCase();
        if (style && intro.includes(style)) score += 1;
      }
      score += (avg || 0) * 0.2;
      return { v, avg, services: servicesMap.get(v.id) || [], score };
    });

  if (sort === "recommended") {
    vendors.sort((a, b) => (b.score || 0) - (a.score || 0));
  } else if (sort === "rating") {
    vendors.sort((a, b) => (b.avg || 0) - (a.avg || 0));
  } else if (sort === "services") {
    vendors.sort((a, b) => b.services.length - a.services.length);
  }

  const categories = Array.from(new Set(servicesByVendor.map(s => s.type as string))).slice(0, 12);

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <h1 className="text-2xl font-bold text-white">Find Vendors & Packages</h1>
      
      {/* Featured Packages Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Featured Packages</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPackages.map((pkg: any) => (
            <Link
              key={pkg.id}
              href={`/packages/${pkg.id}`}
              className="group flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 transition hover:border-neutral-700"
            >
              <div className="p-4">
                <div className="mb-2 text-xs text-indigo-400">
                  {pkg.vendor.vendorProfile?.location || "Experience"}
                </div>
                <h3 className="mb-1 text-lg font-semibold text-white group-hover:text-indigo-400">
                  {pkg.name}
                </h3>
                <p className="line-clamp-2 text-sm text-neutral-400 mb-4">
                  {pkg.description}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-neutral-800 pt-3">
                  <div className="text-xs text-neutral-500">By {pkg.vendor.name}</div>
                  <div className="font-semibold text-emerald-400">
                    ${pkg.priceCents / 100}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white pt-4">Browse Vendors</h2>
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-4" action="/vendors" method="get">
        <input name="location" defaultValue={location} placeholder="Location" className="rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800" />
        <select name="category" defaultValue={category} className="rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800">
          <option value="">All categories</option>
          {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <select name="sort" defaultValue={sort} className="rounded bg-neutral-950 px-3 py-2 text-sm ring-1 ring-neutral-800">
          <option value="recommended">Recommended for you</option>
          <option value="rating">Sort by rating</option>
          <option value="services">Sort by services</option>
        </select>
        <button className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Search</button>
      </form>

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">No vendors found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vendors.map(({ v, avg, services }) => (
            <div key={v.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-800">
                  {v.vendorProfile?.logoUrl ? (
                    <img src={v.vendorProfile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                      {v.name?.charAt(0) || "V"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Link href={`/vendors/${v.id}`} className="font-semibold text-white hover:underline">{v.name || "Vendor"}</Link>
                  <div className="text-xs text-neutral-400">{v.vendorProfile?.location || "Unknown location"}</div>
                  {avg !== null && <div className="text-xs text-neutral-300">Rating: {avg}/5</div>}
                </div>
              </div>
              {services.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {services.slice(0, 6).map(s => (
                    <span key={s.type} className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300">{s.type}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

