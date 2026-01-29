"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { getRequestMetadata } from "@/lib/request-metadata";

const ShareTripSchema = z.object({
  tripId: z.string().min(1),
  vendorIds: z.string().transform((str) => str.split(",").filter(Boolean)),
  expiresAt: z.coerce.date().min(new Date(), "Expiry must be in the future")
});

export async function shareTrip(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = ShareTripSchema.safeParse({
    tripId: String(formData.get("tripId") ?? ""),
    vendorIds: String(formData.get("vendorIds") ?? ""),
    expiresAt: formData.get("expiresAt")
  });

  if (!parsed.success) {
    return { error: "Invalid data: " + parsed.error.message };
  }

  const { tripId, vendorIds, expiresAt } = parsed.data;

  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: actorId } });
  if (!trip) return { error: "Trip not found" };

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      // Create shares
      await prisma.$transaction(
        vendorIds.map((vendorId) =>
          prisma.tripShare.create({
            data: {
              tripId,
              vendorId,
              status: "PENDING",
              expiresAt
            }
          })
        )
      );

      await appendAuditLog({
        actorId,
        actorRole,
        action: "TRIP_SHARED",
        resourceType: "Trip",
        resourceId: tripId,
        oldValue: null,
        newValue: { vendorIds, expiresAt }
      });
    }
  );

  redirect(`/trips/${tripId}`);
}
