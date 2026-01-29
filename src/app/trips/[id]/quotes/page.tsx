import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X, FileText, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { respondToQuote } from "./actions";
import { DeleteTripShareButton } from "./delete-share-button";

export default async function TripQuotesPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) notFound();

  // Defensive check for Prisma Client sync issues
  if (!prisma.tripShare) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-red-200">
          <h2 className="text-xl font-bold">System Error</h2>
          <p>The database client is out of sync. Please restart the application server to apply the latest schema changes.</p>
        </div>
      </div>
    );
  }

  const shares = await prisma.tripShare.findMany({
    where: { tripId: id },
    include: {
      vendor: {
        include: { vendorProfile: true }
      },
      quote: true
    },
    orderBy: { createdAt: "desc" }
  });

  async function respondToQuoteAction(formData: FormData) {
    "use server";
    await respondToQuote(formData);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <Link
        href={`/trips/${id}`}
        className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trip
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vendor Quotes</h1>
          <p className="text-neutral-400">Manage quotes received from vendors.</p>
        </div>
        <Link
            href={`/trips/${id}/share`}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
            Request More Quotes
        </Link>
      </div>

      <div className="space-y-4">
        {shares.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
            No quotes requested yet.
          </div>
        ) : (
          shares.map((share) => (
            <div key={share.id} className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
              {/* Header: Vendor Info */}
              <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/50 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-800">
                    {share.vendor.vendorProfile?.logoUrl ? (
                      <img src={share.vendor.vendorProfile.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neutral-500">
                        {share.vendor.name?.charAt(0) || "V"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{share.vendor.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span>Requested {new Date(share.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className={
                            share.status === "PENDING" ? "text-yellow-400" :
                            share.status === "RESPONDED" ? "text-blue-400" :
                            share.status === "ACCEPTED" ? "text-green-400" :
                            share.status === "REJECTED" ? "text-red-400" :
                            "text-neutral-500"
                        }>{share.status}</span>
                    </div>
                  </div>
                </div>
                
                {share.status !== "ACCEPTED" && (
                    <DeleteTripShareButton shareId={share.id} />
                )}
              </div>

              {/* Body: Quote Details or Pending State */}
              <div className="p-6">
                {share.quote ? (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-neutral-400">Quoted Price</p>
                                <p className="text-2xl font-bold text-white">{share.quote.currency} {share.quote.price}</p>
                            </div>
                            {share.quote.status === "PENDING" && (
                                <div className="flex gap-2">
                                    <form action={respondToQuoteAction}>
                                        <input type="hidden" name="quoteId" value={share.quote.id} />
                                        <input type="hidden" name="decision" value="ACCEPTED" />
                                        <button className="inline-flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500">
                                            <Check className="h-4 w-4" /> Accept
                                        </button>
                                    </form>
                                    <form action={respondToQuoteAction}>
                                        <input type="hidden" name="quoteId" value={share.quote.id} />
                                        <input type="hidden" name="decision" value="REJECTED" />
                                        <button className="inline-flex items-center gap-2 rounded bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-600/20">
                                            <X className="h-4 w-4" /> Reject
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {share.quote.notes && (
                            <div className="rounded-lg bg-neutral-950 p-4">
                                <p className="mb-2 text-xs font-semibold text-neutral-500">VENDOR NOTES</p>
                                <p className="text-sm text-neutral-300">{share.quote.notes}</p>
                            </div>
                        )}

                        {Array.isArray(share.quote.attachments) && (share.quote.attachments as string[]).length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-semibold text-neutral-500">ATTACHMENTS</p>
                                <div className="flex flex-wrap gap-2">
                                    {(share.quote.attachments as string[]).map((url, idx) => (
                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700">
                                            <FileText className="h-4 w-4" />
                                            Document {idx + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-8 text-neutral-500">
                        <div className="text-center">
                            <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                            <p>Waiting for vendor response...</p>
                            <p className="text-xs">Expires {new Date(share.expiresAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
