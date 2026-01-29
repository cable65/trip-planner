"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { getRequestMetadata } from "@/lib/request-metadata";
import { runWithAuditContext } from "@/lib/audit-context";

const CreateBookingSchema = z.object({
  tripId: z.string().min(1),
  type: z.string().min(2).max(80),
  price: z.coerce.number().int().positive(),
  vendorId: z.string().optional()
});

export async function createBooking(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = CreateBookingSchema.safeParse({
    tripId: String(formData.get("tripId") ?? ""),
    type: String(formData.get("type") ?? ""),
    price: String(formData.get("price") ?? ""),
    vendorId: String(formData.get("vendorId") ?? "") || undefined
  });
  if (!parsed.success) return;

  const { tripId, type, price, vendorId } = parsed.data;

  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: actorId } });
  if (!trip) return;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.booking.create({
        data: {
          tripId,
          vendorId,
          type,
          price,
          status: "pending"
        }
      })
  );

  redirect(`/trips/${tripId}`);
}

