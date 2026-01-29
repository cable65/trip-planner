import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { formatDistanceToNow } from "date-fns";

import { ReviewButton } from "@/components/review-button";

export default async function VendorDashboardPage() {
  const session = await requireUser();
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  if (role !== "vendor") return <div>Unauthorized</div>;

  // Defensive check for Prisma Client sync issues
  if (!prisma.tripShare) {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-red-200">
        <h2 className="text-xl font-bold">System Error</h2>
        <p>The database client is out of sync. Please restart the application server to apply the latest schema changes.</p>
      </div>
    );
  }

  const shares = await prisma.tripShare.findMany({
    where: { vendorId: userId },
    include: {
      trip: {
        select: {
          destination: true,
          startDate: true,
          endDate: true,
          budget: true,
          user: { select: { name: true } }
        }
      },
      quote: { select: { status: true, price: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  const [
    totalShares,
    pendingShares,
    respondedShares,
    acceptedShares,
    rejectedShares,
    expiredShares,
    totalQuotes,
    acceptedQuotes,
    rejectedQuotes,
    pendingQuotes,
    bookingsAgg,
    paymentsAgg,
    quotesForAvg,
    recentBookings,
    packageMetrics
  ] = await Promise.all([
    prisma.tripShare.count({ where: { vendorId: userId } }),
    prisma.tripShare.count({ where: { vendorId: userId, status: "PENDING" } }),
    prisma.tripShare.count({ where: { vendorId: userId, status: "RESPONDED" } }),
    prisma.tripShare.count({ where: { vendorId: userId, status: "ACCEPTED" } }),
    prisma.tripShare.count({ where: { vendorId: userId, status: "REJECTED" } }),
    prisma.tripShare.count({ where: { vendorId: userId, status: "EXPIRED" } }),
    prisma.quote.count({ where: { tripShare: { vendorId: userId } } }),
    prisma.quote.count({ where: { tripShare: { vendorId: userId }, status: "ACCEPTED" } }),
    prisma.quote.count({ where: { tripShare: { vendorId: userId }, status: "REJECTED" } }),
    prisma.quote.count({ where: { tripShare: { vendorId: userId }, status: "PENDING" } }),
    prisma.booking.aggregate({ where: { vendorId: userId, status: "confirmed" }, _count: { _all: true }, _sum: { price: true } }),
    prisma.payment.aggregate({ where: { status: "paid", booking: { vendorId: userId } }, _sum: { amount: true } }),
    prisma.quote.findMany({ where: { tripShare: { vendorId: userId } }, select: { createdAt: true, tripShare: { select: { createdAt: true } } } }),
    prisma.booking.findMany({
      where: { vendorId: userId, status: "confirmed" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { trip: { select: { user: { select: { id: true, name: true } }, destination: true } } }
    }),
    prisma.packageMetric.findMany({
      where: { package: { vendorId: userId } },
      include: { package: { select: { name: true } } },
      orderBy: { views: "desc" },
      take: 5
    })
  ]);


  const acceptanceRate = totalQuotes === 0 ? 0 : Math.round((acceptedQuotes / totalQuotes) * 100);
  const avgResponseHours = quotesForAvg.length === 0
    ? 0
    : Math.round(
        quotesForAvg
          .map((q) => q.createdAt.getTime() - q.tripShare.createdAt.getTime())
          .reduce((a, b) => a + b, 0) / quotesForAvg.length / 3600000
      );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Vendor Dashboard</h1>

      <div>
        <Link
          href="/vendor/requests/bulk"
          className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Bulk Respond to Requests
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-xs text-neutral-400">Requests</div>
          <div className="mt-1 text-2xl font-bold text-white">{totalShares}</div>
          <div className="mt-2 text-xs text-neutral-400">Pending {pendingShares} • Responded {respondedShares}</div>
          <div className="text-xs text-neutral-400">Accepted {acceptedShares} • Rejected {rejectedShares} • Expired {expiredShares}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-xs text-neutral-400">Quotes</div>
          <div className="mt-1 text-2xl font-bold text-white">{totalQuotes}</div>
          <div className="mt-2 text-xs text-neutral-400">Accepted {acceptedQuotes} • Rejected {rejectedQuotes} • Pending {pendingQuotes}</div>
          <div className="text-xs text-neutral-400">Acceptance Rate {acceptanceRate}%</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-xs text-neutral-400">Bookings (confirmed)</div>
          <div className="mt-1 text-2xl font-bold text-white">{bookingsAgg._count._all || 0}</div>
          <div className="mt-2 text-xs text-neutral-400">Revenue ${bookingsAgg._sum.price || 0}</div>
          <div className="text-xs text-neutral-400">Paid ${paymentsAgg._sum.amount || 0}</div>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="text-xs text-neutral-400">Avg Response Time</div>
          <div className="mt-1 text-2xl font-bold text-white">{avgResponseHours}h</div>
          <div className="mt-2 text-xs text-neutral-400">From request to quote</div>
        </div>
      </div>

      <div className="grid gap-4">
        <h2 className="text-xl font-bold text-white">Top Performing Packages</h2>
        {packageMetrics.length === 0 ? (
           <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
             No package data yet.
           </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="bg-neutral-800 text-xs font-medium uppercase text-neutral-300">
                <tr>
                  <th className="px-6 py-3">Package Name</th>
                  <th className="px-6 py-3">Views</th>
                  <th className="px-6 py-3">Bookings</th>
                  <th className="px-6 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {packageMetrics.map((metric: any) => (
                  <tr key={metric.packageId}>
                    <td className="px-6 py-4 font-medium text-white">{metric.package.name}</td>
                    <td className="px-6 py-4">{metric.views}</td>
                    <td className="px-6 py-4">{metric.bookings}</td>
                    <td className="px-6 py-4 text-emerald-400">${metric.revenue / 100}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <h2 className="text-xl font-bold text-white">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
            No bookings yet.
          </div>
        ) : (
          recentBookings.map((booking: any) => (
            <div key={booking.id} className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {booking.type}
                </h3>
                <p className="text-sm text-neutral-400">
                  Traveler: {booking.trip.user.name || "Anonymous"} • Destination: {booking.trip.destination}
                </p>
                <p className="text-xs text-neutral-500">
                  Booked {formatDistanceToNow(booking.createdAt, { addSuffix: true })}
                </p>
              </div>
              <div>
                <ReviewButton targetType="User" targetId={booking.trip.user.id} label="Rate Traveler" />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid gap-4">
        <h2 className="text-xl font-bold text-white">Trip Requests</h2>
        {shares.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
            No trip requests received yet.
          </div>
        ) : (
          shares.map((share) => (
            <div key={share.id} className="flex flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    share.status === "PENDING" ? "bg-yellow-400/10 text-yellow-400 ring-yellow-400/20" :
                    share.status === "RESPONDED" ? "bg-green-400/10 text-green-400 ring-green-400/20" :
                    "bg-red-400/10 text-red-400 ring-red-400/20"
                  }`}>
                    {share.status}
                  </span>
                  <span className="text-xs text-neutral-500">
                    Expires {formatDistanceToNow(new Date(share.expiresAt), { addSuffix: true })}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Trip to {share.trip.destination}
                </h3>
                <p className="text-sm text-neutral-400">
                  Traveler: {share.trip.user.name || "Anonymous"} • Budget: {share.trip.budget ? `$${share.trip.budget}` : "N/A"}
                </p>
              </div>

              <div>
                {share.status === "PENDING" && new Date(share.expiresAt) > new Date() ? (
                  <Link
                    href={`/vendor/requests/${share.id}`}
                    className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Send Quote
                  </Link>
                ) : (
                  <Link
                    href={`/vendor/requests/${share.id}`}
                    className="inline-flex items-center rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-neutral-700"
                  >
                    View Details
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
