import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { submitQuote } from "./actions";
import { DayTimeline } from "@/app/trips/[id]/day-timeline";

export default async function RequestDetailsPage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id;

  const share = await prisma.tripShare.findUnique({
    where: { id: shareId },
    include: {
      trip: true,
      quote: true
    }
  });

  if (!share || share.vendorId !== userId) notFound();

  const trip = share.trip;
  const itinerary = trip.itinerary as any;
  const days = Array.isArray(itinerary?.days) ? itinerary.days : [];

  const isExpired = new Date(share.expiresAt) < new Date();
  const hasResponded = !!share.quote;

  async function submitQuoteAction(formData: FormData) {
    "use server";
    await submitQuote(formData);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Trip Details */}
      <div className="space-y-6 lg:col-span-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Trip Request: {trip.destination}</h1>
          <div className="mt-2 flex gap-4 text-sm text-neutral-400">
             <span>Budget: {trip.budget ? `$${trip.budget}` : "N/A"}</span>
             <span>•</span>
             <span>Travelers: {trip.travelStyle || "Standard"}</span>
          </div>
        </div>

        <div className="space-y-6">
            {days.map((day: any, idx: number) => (
                <DayTimeline key={idx} tripId={trip.id} day={day} />
            ))}
        </div>
      </div>

      {/* Quote Form */}
      <div className="space-y-6">
        <div className="sticky top-6 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Submit Quotation</h2>
            
            {hasResponded ? (
                <div className="space-y-4">
                    <div className="rounded bg-green-900/20 p-4 text-green-400">
                        <p className="font-semibold">Quote Submitted</p>
                        <p className="text-sm">Price: {share.quote?.currency} {share.quote?.price}</p>
                        <p className="text-sm">Status: {share.quote?.status}</p>
                    </div>
                </div>
            ) : isExpired ? (
                <div className="rounded bg-red-900/20 p-4 text-red-400">
                    <p className="font-semibold">Request Expired</p>
                    <p className="text-sm">This request expired on {new Date(share.expiresAt).toLocaleDateString()}</p>
                </div>
            ) : (
                <form action={submitQuoteAction} className="space-y-4">
                  <input type="hidden" name="shareId" value={shareId} />
                    
                    <div>
                        <label className="mb-1 block text-xs text-neutral-400">Total Price</label>
                        <div className="flex gap-2">
                             <select name="currency" className="rounded bg-neutral-950 px-3 py-2 text-sm text-white ring-1 ring-neutral-800">
                                 <option value="USD">USD</option>
                                 <option value="EUR">EUR</option>
                                 <option value="MYR">MYR</option>
                                 <option value="SGD">SGD</option>
                             </select>
                             <input type="number" name="price" required min="1" className="flex-1 rounded bg-neutral-950 px-3 py-2 text-sm text-white ring-1 ring-neutral-800" placeholder="0.00" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-neutral-400">Notes to Traveler</label>
                        <textarea name="notes" rows={4} maxLength={500} className="w-full rounded bg-neutral-950 px-3 py-2 text-sm text-white ring-1 ring-neutral-800" placeholder="Includes flights, hotels..."></textarea>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-neutral-400">Attachment (PDF/Doc)</label>
                        <input type="file" name="attachment" accept=".pdf,.doc,.docx,.xls,.xlsx" className="w-full text-xs text-neutral-400" />
                    </div>

                    <button className="w-full rounded bg-indigo-600 py-2 text-sm font-bold text-white hover:bg-indigo-500">
                        Submit Quote
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
}
