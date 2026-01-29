import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Clock, Upload, FileText, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { getUserCurrencyAndLocale, formatCurrency } from "@/lib/currency";
import { createPayment, refundPayment, submitPaymentProof, shareItineraryWithVendor } from "./actions";
import { StatusSelect } from "./status-select";
import { startConversation } from "@/app/actions/conversation";
import { Share2 } from "lucide-react";
import { SharedItineraryView } from "@/components/shared-itinerary-view";

export default async function BookingPage({
  params
}: {
  params: Promise<{ id: string; bookingId: string }>;
}) {
  const { id: tripId, bookingId } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tripId },
    include: { payments: { orderBy: { createdAt: "desc" } } }
  });

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId }
  });

  if (!booking || !trip) notFound();

  // Verify if vendor exists as a user (to enable chat)
  const vendorUser = booking.vendorId 
    ? await prisma.user.findUnique({ where: { id: booking.vendorId } })
    : null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  const { currency, locale } = getUserCurrencyAndLocale(user?.preferences as any);

  const totalPaid = booking.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, booking.price - totalPaid);

  const itinerary = trip.itinerary as any;
  const days = Array.isArray(itinerary?.days) ? itinerary.days : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <Link
        href={`/trips/${tripId}`}
        className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trip
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {booking.type}
          </h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-neutral-400">
            <span>{formatCurrency({ amount: booking.price, currency, locale })}</span>
            <span>•</span>
            <span className="font-mono">Ref: {booking.id.slice(-8)}</span>
            {vendorUser && (
              <form action={async () => {
                "use server";
                await startConversation(
                  vendorUser.id, 
                  `Hi, I have a question about my booking for ${booking.type} (Ref: ${booking.id.slice(-8)})`
                );
              }}>
                <button className="flex items-center gap-2 rounded bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors">
                  <MessageCircle size={14} />
                  Contact Vendor
                </button>
              </form>
            )}
            
            {vendorUser && booking.status === "confirmed" && (
              <form action={shareItineraryWithVendor}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button 
                  className="flex items-center gap-2 rounded bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                  title="Share Itinerary with Vendor"
                >
                  <Share2 size={14} />
                  Share Itinerary
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge status={booking.status} />
          <StatusSelect bookingId={booking.id} defaultStatus={booking.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Itinerary */}
        <div className="md:col-span-2">
          <SharedItineraryView tripId={tripId} days={days} currency={currency} locale={locale} />
        </div>

        {/* Payment Summary */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-white">Payment Status</h2>
          <div className="mt-4 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Total Cost</span>
              <span className="font-medium text-white">{formatCurrency({ amount: booking.price, currency, locale })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Paid so far</span>
              <span className="font-medium text-emerald-400">{formatCurrency({ amount: totalPaid, currency, locale })}</span>
            </div>
            <div className="border-t border-neutral-800 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-neutral-300">Remaining</span>
              <span className={remaining > 0 ? "text-amber-400" : "text-neutral-500"}>
                {formatCurrency({ amount: remaining, currency, locale })}
              </span>
            </div>
          </div>

          {remaining > 0 && booking.notes && (
            <div className="mt-6 rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-indigo-400">Payment Instructions</h3>
              <p className="whitespace-pre-wrap text-sm text-neutral-300">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Payment Actions */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-white">Make Payment</h2>
          
          {remaining > 0 ? (
            <div className="mt-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-white">Offline Payment (Bank Transfer)</h3>
                <p className="text-xs text-neutral-400">
                  Please transfer the remaining amount to the vendor&apos;s account as per the instructions, then upload your receipt here.
                </p>
              </div>
              
              <form action={submitPaymentProof} className="space-y-3">
                <input type="hidden" name="bookingId" value={booking.id} />
                <input type="hidden" name="amount" value={remaining} />
                <input type="hidden" name="currency" value={currency} />
                
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400" htmlFor="proof">
                    Upload Receipt (Image/PDF)
                  </label>
                  <input
                    id="proof"
                    name="proof"
                    type="file"
                    accept="image/*,application/pdf"
                    required
                    className="w-full rounded bg-neutral-950 px-3 py-2 text-sm text-neutral-300 ring-1 ring-neutral-800 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-neutral-300 hover:file:bg-neutral-700"
                  />
                </div>
                
                <button className="flex w-full items-center justify-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  <Upload size={16} /> Submit Proof of Payment
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center py-4 text-center">
              <CheckCircle className="mb-2 h-8 w-8 text-emerald-500" />
              <p className="font-medium text-white">Fully Paid</p>
              <p className="text-sm text-neutral-400">Thank you for your payment!</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Payment History</h2>
        {booking.payments.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
            No payments recorded.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950 text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {booking.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-neutral-300">
                      {p.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatCurrency({ amount: p.amount, currency: p.currency, locale })}
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "paid" ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                            {p.status}
                          </span>
                          <form action={refundPayment}>
                            <input type="hidden" name="paymentId" value={p.id} />
                            <button className="rounded bg-neutral-800 px-2 py-1 text-xs text-white hover:bg-neutral-700">
                              Refund
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-neutral-500/10 px-2 py-0.5 text-xs font-medium text-neutral-400">
                          {p.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    refunded: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
  };

  const labels: Record<string, string> = {
    cancelled: "Declined / Cancelled"
  };

  const icons: Record<string, any> = {
    pending: Clock,
    confirmed: CheckCircle,
    cancelled: XCircle,
    refunded: XCircle
  };

  const Icon = icons[status] || Clock;
  const style = styles[status] || styles.pending;
  const label = labels[status] || status;

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      <Icon className="h-3 w-3" />
      <span className="capitalize">{label}</span>
    </span>
  );
}
