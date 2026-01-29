import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";

import { RecommendedPackages } from "@/components/recommended-packages";

export default async function TripsPage() {
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  // Fetch images for destinations
  const destinationNames = [...new Set(trips.map(t => t.destination))];
  const destinations = await prisma.destination.findMany({
    where: { name: { in: destinationNames, mode: "insensitive" } },
    select: { name: true, imageUrl: true }
  });
  
  // Create map with lowercased keys for case-insensitive lookup
  const imageMap = new Map(destinations.map(d => [d.name.toLowerCase(), d.imageUrl]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Your Trips</h1>
        <Link
          href="/trips/new"
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
        >
          New trip
        </Link>
      </div>

      <RecommendedPackages />

      {trips.length === 0 ? (
        <div className="rounded border border-neutral-800 p-6 text-neutral-300">
          No trips yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => {
            const imageUrl = t.imageUrl || imageMap.get(t.destination.toLowerCase());
            return (
              <Link
                key={t.id}
                href={`/trips/${t.id}`}
                className="group relative block overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition hover:border-neutral-700"
              >
                <div className="aspect-video w-full overflow-hidden bg-neutral-800">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={t.destination}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-600">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60" />
                </div>
                
                <div className="absolute bottom-0 w-full p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-white text-lg shadow-black drop-shadow-md">{t.destination}</div>
                    <div className="rounded-full bg-neutral-900/80 px-2 py-0.5 text-xs text-neutral-300 backdrop-blur-sm">
                      {t.status}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-col gap-1 text-sm text-neutral-300 drop-shadow-md">
                    <div>{t.startDate.toISOString().slice(0, 10)} → {t.endDate.toISOString().slice(0, 10)}</div>
                    <div className="flex items-center gap-3 text-xs opacity-90">
                      <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {t.pax}
                      </div>
                      {t.budget && (
                        <div className="flex items-center gap-1">
                          <span>${t.budget.toLocaleString()}</span>
                          <span className="opacity-75">(${(t.budget / t.pax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/pp)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

