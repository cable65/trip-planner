"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { getRequestMetadata } from "@/lib/request-metadata";

const RespondSchema = z.object({
  quoteId: z.string().min(1),
  decision: z.enum(["ACCEPTED", "REJECTED"])
});

export async function respondToQuote(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = RespondSchema.safeParse({
    quoteId: String(formData.get("quoteId") ?? ""),
    decision: formData.get("decision")
  });

  if (!parsed.success) return { error: "Invalid data" };
  const { quoteId, decision } = parsed.data;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { tripShare: { include: { trip: true } } }
  });

  if (!quote || quote.tripShare.trip.userId !== actorId) {
    return { error: "Unauthorized" };
  }

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      // Update Quote Status
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: { status: decision }
      });

      // Update Share Status
      await prisma.tripShare.update({
        where: { id: quote.tripShareId },
        data: { status: decision }
      });

      await appendAuditLog({
        actorId,
        actorRole,
        action: "QUOTE_DECISION",
        resourceType: "Quote",
        resourceId: quoteId,
        oldValue: { status: quote.status },
        newValue: { status: decision },
        metadata: { decision }
      });
    }
  );

  revalidatePath(`/trips/${quote.tripShare.tripId}/quotes`);
}

const DeleteShareSchema = z.object({
  shareId: z.string().min(1)
});

export async function deleteTripShare(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = DeleteShareSchema.safeParse({
    shareId: String(formData.get("shareId") ?? "")
  });

  if (!parsed.success) return { error: "Invalid data" };
  const { shareId } = parsed.data;

  const share = await prisma.tripShare.findUnique({
    where: { id: shareId },
    include: { trip: true }
  });

  if (!share || share.trip.userId !== actorId) {
    return { error: "Unauthorized" };
  }

  if (share.status === "ACCEPTED") {
    return { error: "Cannot remove an accepted share" };
  }

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      await prisma.tripShare.delete({
        where: { id: shareId }
      });

      await appendAuditLog({
        actorId,
        actorRole,
        action: "TRIP_SHARE_REMOVED",
        resourceType: "TripShare",
        resourceId: shareId,
        oldValue: { status: share.status, vendorId: share.vendorId },
        newValue: null,
        metadata: { tripId: share.tripId }
      });
    }
  );

  revalidatePath(`/trips/${share.tripId}/quotes`);
}
