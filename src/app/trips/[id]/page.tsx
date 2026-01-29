import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { getUserCurrencyAndLocale, formatCurrency } from "@/lib/currency";
import { TripHeader } from "./trip-header";
import { ItineraryEditor } from "./itinerary-editor";
import { CostSummary } from "./cost-summary";
import { ExportFinanceButton } from "./export-finance-button";
import { StatusFilter } from "./status-filter";
import { regenerateTrip } from "./actions";
import { createBooking } from "./bookings/actions";
import { normalizeTripLayoutConfig } from "@/lib/trip-layout";

import { ReviewButton } from "@/components/review-button";
import { MessageCircle } from "lucide-react";
import { startConversation } from "@/app/actions/conversation";

export default async function TripPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const trip = await prisma.trip.findFirst({
    where: { id, userId }
  });
  if (!trip) notFound();

  let imageUrl = trip.imageUrl;
  if (!imageUrl) {
    const dest = await prisma.destination.findFirst({
      where: { name: { equals: trip.destination, mode: "insensitive" } }
    });
    imageUrl = dest?.imageUrl || null;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } });
  const { currency, locale } = getUserCurrencyAndLocale(user?.preferences as any);

  const sp = (await searchParams) ?? {};
  const statusFilter = typeof sp.status === "string" ? sp.status : undefined;
  const bookings = await prisma.booking.findMany({
    where: { tripId: trip.id, ...(statusFilter ? { status: statusFilter as any } : {}) },
    include: { payments: true },
    orderBy: { createdAt: "desc" }
  });

  const itinerary = trip.itinerary as any;
  const days = Array.isArray(itinerary?.days) ? itinerary.days : [];
  const estimatedTotal = itinerary?.estimatedTotalCost || 0;

  const layoutRow = await (prisma as any).tripUiPreference.findUnique({ where: { id: "default" } });
  const layoutConfig = layoutRow
    ? normalizeTripLayoutConfig({
        version: layoutRow.version,
        visibility: layoutRow.visibility,
        sequence: layoutRow.sequence
      })
    : normalizeTripLayoutConfig(null);

  const globalLinks = layoutConfig.visibility.itineraryLinks;
  const overrideLinks = (itinerary && itinerary.itineraryLinksOverride) || {};
  const effectiveLinkSettings = {
    showDirections:
      typeof overrideLinks.showDirections === "boolean"
        ? overrideLinks.showDirections
        : globalLinks.showDirections,
    showMap:
      typeof overrideLinks.showMap === "boolean" ? overrideLinks.showMap : globalLinks.showMap,
    showMoreInfo:
      typeof overrideLinks.showMoreInfo === "boolean"
        ? overrideLinks.showMoreInfo
        : globalLinks.showMoreInfo
  };

  return (
    <div className="space-y-8">
      <Link
        href="/trips"
        className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trips
      </Link>

      <TripHeader
        tripId={trip.id}
        destination={trip.destination}
        startDate={trip.startDate}
        endDate={trip.endDate}
        budget={trip.budget}
        pax={trip.pax}
        travelStyle={trip.travelStyle}
        interests={trip.interests}
        currency={currency}
        locale={locale}
        imageUrl={imageUrl}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <h2 className="text-xl font-bold text-white">Daily Itinerary</h2>
          {days.length > 0 ? (
            <ItineraryEditor
              tripId={trip.id}
              initialDays={days}
              estimatedTotal={estimatedTotal}
              notes={itinerary?.notes}
              currency={currency}
              locale={locale}
              linkSettings={effectiveLinkSettings}
            />
          ) : (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
              No itinerary details available.
            </div>
          )}
        </div>

        <div className="space-y-8">
          <h2 className="text-xl font-bold text-white">Trip Summary</h2>
          <CostSummary estimatedTotal={estimatedTotal} budget={trip.budget} currency={currency} locale={locale} />

          {layoutConfig.sequence.map((blockId) => {
            if (blockId === "tripFinances") {
              if (!layoutConfig.visibility.tripFinances) return null;
              return (
                <div key="tripFinances" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Trip Finances</h3>
                    <ExportFinanceButton tripId={trip.id} status={statusFilter} />
                  </div>
                  <StatusFilter defaultStatus={statusFilter} />
                  {(() => {
                    const totalPrice = bookings.reduce((s, b) => s + b.price, 0);
                    const totalPaid = bookings.reduce(
                      (s, b) =>
                        s +
                        b.payments
                          .filter((p) => p.status === "paid")
                          .reduce((x, p) => x + p.amount, 0),
                      0
                    );
                    const remaining = Math.max(0, totalPrice - totalPaid);
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-neutral-400">Bookings Total</span><span className="font-medium text-white">{formatCurrency({ amount: totalPrice, currency, locale })}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-400">Paid</span><span className="font-medium text-emerald-400">{formatCurrency({ amount: totalPaid, currency, locale })}</span></div>
                        <div className="flex justify-between border-t border-neutral-800 pt-2"><span className="text-neutral-300">Remaining</span><span className={remaining>0?"text-amber-400":"text-neutral-500"}>{formatCurrency({ amount: remaining, currency, locale })}</span></div>
                      </div>
                    );
                  })()}
                </div>
              );
            }

            if (blockId === "regenerate") {
              return (
                <form
                  key="regenerate"
                  action={regenerateTrip}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-6"
                >
                  <input type="hidden" name="tripId" value={trip.id} />
                  <h3 className="font-semibold text-white">Regenerate itinerary</h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    Re-runs the AI using your latest trip settings.
                  </p>
                  <button className="mt-4 w-full rounded bg-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">
                    Regenerate
                  </button>
                </form>
              );
            }

            if (blockId === "notes") {
              if (!itinerary?.notes || itinerary.notes.length === 0) return null;
              return (
                <div key="notes" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                  <h3 className="mb-4 font-semibold text-white">Notes & Tips</h3>
                  <ul className="list-inside list-disc space-y-2 text-sm text-neutral-400">
                    {itinerary.notes.map((note: string, idx: number) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              );
            }

            if (blockId === "bookings") {
              if (!layoutConfig.visibility.bookings) return null;
              return (
                <div key="bookings" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                  <h3 className="mb-4 font-semibold text-white">Bookings</h3>

                  {bookings.length === 0 ? (
                    <p className="text-sm text-neutral-400">No bookings added yet.</p>
                  ) : (
                    <ul className="mb-4 space-y-2 text-sm">
                      {bookings.map((b) => (
                        <li key={b.id}>
                          <Link
                            href={`/trips/${trip.id}/bookings/${b.id}`}
                            className="group flex items-center justify-between gap-3 rounded-lg p-2 transition hover:bg-neutral-800"
                          >
                            <div>
                              <div className="font-medium text-neutral-100 group-hover:text-white">
                                {b.type}
                              </div>
                              <div className="text-xs text-neutral-400">{b.status}</div>
                            </div>
                            <div className="text-sm font-semibold text-neutral-100">
                              {formatCurrency({ amount: b.price, currency, locale })}
                            </div>
                          </Link>
                          {b.vendorId && (
                             <div className="ml-2 pl-2 border-l border-neutral-800 flex items-center gap-2">
                               <form action={async () => {
                                 "use server";
                                 await startConversation(
                                   b.vendorId!, 
                                   `Hi, regarding my booking for ${b.type} (Ref: ${b.id.slice(-8)})`
                                 );
                               }}>
                                 <button className="p-1 text-neutral-400 hover:text-white" title="Contact Vendor">
                                   <MessageCircle size={14} />
                                 </button>
                               </form>
                               <ReviewButton targetType="Vendor" targetId={b.vendorId} label="Rate" />
                             </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    action={createBooking}
                    className="mt-4 space-y-3 border-t border-neutral-800 pt-4 text-sm"
                  >
                    <input type="hidden" name="tripId" value={trip.id} />
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-400" htmlFor="booking-type">
                          Type
                        </label>
                        <input
                          id="booking-type"
                          name="type"
                          required
                          placeholder="Flight, hotel, activity"
                          className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-400" htmlFor="booking-price">
                          Price
                        </label>
                        <input
                          id="booking-price"
                          name="price"
                          type="number"
                          min={1}
                          required
                          className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-400" htmlFor="booking-vendor">
                          Vendor / Reference (optional)
                        </label>
                        <input
                          id="booking-vendor"
                          name="vendorId"
                          placeholder="Booking reference or vendor"
                          className="w-full rounded bg-neutral-950 px-3 py-2 text-xs ring-1 ring-neutral-800"
                        />
                      </div>
                    </div>

                    <button className="w-full rounded bg-neutral-800 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-700">
                      Add booking
                    </button>
                  </form>
                </div>
              );
            }

            if (blockId === "vendorQuotes") {
              return (
                <div key="vendorQuotes" className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                  <h3 className="mb-2 font-semibold text-white">Vendor Quotes</h3>
                  <p className="mb-4 text-xs text-neutral-400">
                    Share your trip plan with vendors to get price quotes.
                  </p>
                  <Link
                    href={`/trips/${trip.id}/quotes`}
                    className="block w-full rounded bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Manage Quotes
                  </Link>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
