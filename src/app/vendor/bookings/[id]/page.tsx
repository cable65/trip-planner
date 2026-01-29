
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, CheckCircle, AlertCircle, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { formatCurrency } from "@/lib/currency";
import { updateBookingInstructions, approvePayment } from "./actions";
import { startConversation } from "@/app/actions/conversation";
import { DeclineBookingButton } from "./decline-booking-button";
import { SharedItineraryView } from "@/components/shared-itinerary-view";
import { getUserCurrencyAndLocale } from "@/lib/currency";

export default async function VendorBookingDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  if (role !== "vendor") return <div>Unauthorized</div>;

  const booking = await prisma.booking.findFirst({
    where: { id, vendorId: userId },
    include: {
      trip: {
        include: {
          user: { select: { name: true, email: true } }
        }
      },
      payments: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!booking) notFound();

  const totalPaid = booking.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, booking.price - totalPaid);

  const pendingCount = booking.payments.filter(p => p.status === "pending").length;

  const itinerary = booking.trip.itinerary as any;
  const days = Array.isArray(itinerary?.days) ? itinerary.days : [];
  const { currency, locale } = getUserCurrencyAndLocale({} as any); // Use default/system currency since we don't have vendor prefs handy easily

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <Link
        href="/vendor/bookings"
        className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bookings
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Booking #{booking.id.slice(-8)}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-400">
            <span>{booking.trip.user.name}</span>
            <span>•</span>
            <span>{booking.type}</span>
            <form action={async () => {
              "use server";
              await startConversation(
                booking.trip.userId, 
                `Hi ${booking.trip.user.name}, regarding your booking #${booking.id.slice(-8)}...`
              );
            }}>
              <button className="ml-2 flex items-center gap-1.5 rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300 hover:bg-neutral-700 hover:text-white">
                <MessageCircle size={12} />
                Message Traveler
              </button>
            </form>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            booking.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
          }`}>
            {booking.status}
          </span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Payment Status & Actions */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Payment Status */}
          <div className="space-y-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-lg font-semibold text-white">Payment Status</h2>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Price</span>
                  <span className="font-medium text-white">{formatCurrency({ amount: booking.price })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Paid Amount</span>
                  <span className="font-medium text-emerald-400">{formatCurrency({ amount: totalPaid })}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-800 pt-3">
                  <span className="text-neutral-300">Remaining</span>
                  <span className={`font-bold ${remaining > 0 ? "text-amber-400" : "text-neutral-500"}`}>
                    {formatCurrency({ amount: remaining })}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="text-lg font-semibold text-white">Payment Instructions</h2>
              <p className="mb-4 text-sm text-neutral-400">
                Provide offline payment details (e.g., Bank Transfer info) for the traveler.
              </p>
              <form action={updateBookingInstructions}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <textarea
                  name="notes"
                  defaultValue={booking.notes || ""}
                  placeholder="Bank Name: Example Bank&#10;Account No: 1234567890&#10;Name: Demo Vendor"
                  className="w-full rounded bg-neutral-950 p-3 text-sm text-white ring-1 ring-neutral-800 focus:ring-indigo-500"
                  rows={5}
                />
                <button className="mt-3 w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  Update Instructions
                </button>
              </form>
            </div>

            {booking.status !== "cancelled" && (
              <div className="rounded-xl border border-red-900/30 bg-red-900/10 p-6">
                <h2 className="text-lg font-semibold text-red-400">Decline Booking</h2>
                <p className="mb-4 text-sm text-neutral-400">
                  If you cannot fulfill this booking, you can decline it. This will notify the traveler and cancel the booking.
                </p>
                <DeclineBookingButton bookingId={booking.id} />
              </div>
            )}
          </div>

          {/* Payment Verification */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 h-fit">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              Payment Verification
              {pendingCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-black">
                  {pendingCount}
                </span>
              )}
            </h2>
            
            {booking.payments.length === 0 ? (
              <div className="mt-4 text-center text-sm text-neutral-500">
                No payments recorded yet.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {booking.payments.map((payment) => {
                  const meta = payment.metadata as any;
                  const isPending = payment.status === "pending";
                  
                  return (
                    <div key={payment.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                      <div className="flex justify-between">
                        <span className="font-medium text-white">{formatCurrency({ amount: payment.amount })}</span>
                        <span className={`text-xs ${isPending ? "text-amber-400" : "text-emerald-400"}`}>
                          {isPending ? "Pending Review" : "Verified"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-neutral-400">
                        Date: {payment.createdAt.toLocaleDateString()}
                      </div>
                      
                      {meta?.proofUrl && (
                        <div className="mt-3">
                          <p className="mb-1 text-xs text-neutral-500">Proof of Payment:</p>
                          <a 
                            href={meta.proofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300"
                          >
                            <FileText size={14} /> View Receipt
                          </a>
                        </div>
                      )}

                      {isPending ? (
                        <form action={approvePayment} className="mt-4">
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <button className="flex w-full items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                            <CheckCircle size={16} /> Approve Payment
                          </button>
                        </form>
                      ) : (
                        <div className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-emerald-500 opacity-50 cursor-not-allowed">
                           <CheckCircle size={16} /> Payment Approved
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Daily Itinerary */}
        <SharedItineraryView tripId={booking.tripId} days={days} currency={currency} locale={locale} />
      </div>
    </div>
  );
}
