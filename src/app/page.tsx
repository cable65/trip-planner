import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  const userId = (session?.user as any)?.id as string | undefined;

  const [vendors, trips] = await Promise.all([
    prisma.user.findMany({
      where: { role: "vendor" },
      include: { vendorProfile: true },
      take: 8
    }),
    userId
      ? prisma.trip.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 4 })
      : Promise.resolve([] as any[])
  ]);

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Plan your trip with AI</h1>
        <p className="max-w-2xl text-neutral-300">
          Generate day-by-day itineraries, manage bookings, and explore trusted vendors.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/trips/new"
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Create Trip Package
          </Link>
          <Link
            href="/vendors"
            className="rounded bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Browse Vendors
          </Link>
          {!session?.user && (
            <Link
              href="/register"
              className="rounded bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Create account
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Featured Vendors</h2>
          <Link href="/vendors" className="text-sm text-neutral-400 hover:text-white">View all</Link>
        </div>
        {vendors.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">
            No vendors yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vendors.map((v) => (
              <Link key={v.id} href={`/vendors/${v.id}`} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-neutral-800">
                    {v.vendorProfile?.logoUrl ? (
                      <img src={v.vendorProfile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neutral-500">
                        {v.name?.charAt(0) || "V"}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{v.name || "Vendor"}</div>
                    <div className="text-xs text-neutral-400">{v.vendorProfile?.location || "Unknown location"}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {session?.user && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your Trip Packages</h2>
            <Link href="/trips" className="text-sm text-neutral-400 hover:text-white">View all</Link>
          </div>
          {trips.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">
              No trips yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trips.map((t) => (
                <Link key={t.id} href={`/trips/${t.id}`} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-700">
                  <div className="font-medium text-white">{t.destination}</div>
                  <div className="mt-1 text-xs text-neutral-400">
                    {t.startDate.toISOString().slice(0, 10)} → {t.endDate.toISOString().slice(0, 10)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

