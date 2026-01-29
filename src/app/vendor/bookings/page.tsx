
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { formatCurrency } from "@/lib/currency";

export default async function VendorBookingsPage() {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;
  
  if (role !== "vendor") return <div>Unauthorized</div>;

  const bookings = await prisma.booking.findMany({
    where: { vendorId: userId },
    include: {
      trip: {
        include: {
          user: { select: { name: true, email: true } }
        }
      },
      payments: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Booking Management</h1>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
          No bookings yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950 text-neutral-400">
              <tr>
                <th className="px-6 py-3 font-medium">Booking ID</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Payment</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {bookings.map((booking) => {
                const totalPaid = booking.payments
                  .filter((p) => p.status === "paid")
                  .reduce((sum, p) => sum + p.amount, 0);
                const paymentStatus = totalPaid >= booking.price 
                  ? "Paid" 
                  : totalPaid > 0 ? "Partial" : "Pending";

                return (
                  <tr key={booking.id} className="hover:bg-neutral-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                      {booking.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{booking.trip.user.name}</div>
                      <div className="text-xs text-neutral-500">{booking.trip.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-300">
                      {booking.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        booking.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" :
                        booking.status === "cancelled" ? "bg-red-500/10 text-red-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        {formatCurrency({ amount: booking.price, currency: "USD" })}
                      </div>
                      <div className={`text-xs ${
                        paymentStatus === "Paid" ? "text-emerald-400" : "text-amber-400"
                      }`}>
                        {paymentStatus}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/vendor/bookings/${booking.id}`}
                        className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
