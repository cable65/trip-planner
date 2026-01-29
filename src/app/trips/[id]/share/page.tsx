import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { shareTrip } from "./actions";
import { VendorSelectionForm } from "./vendor-selection-form";

export default async function ShareTripPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  const userId = (session.user as any).id as string;

  const trip = await prisma.trip.findFirst({
    where: { id, userId }
  });
  if (!trip) notFound();

  // In production, filter by isApproved: true
  const vendors = await prisma.user.findMany({
    where: { role: "vendor" },
    include: { vendorProfile: true }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <Link
        href={`/trips/${id}`}
        className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to trip
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Get Quotes from Vendors</h1>
        <p className="text-neutral-400">Select vendors to share your trip plan with.</p>
      </div>

      <VendorSelectionForm tripId={id} vendors={vendors} action={shareTrip} />
    </div>
  );
}
