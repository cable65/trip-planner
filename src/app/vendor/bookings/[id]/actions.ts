
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { getRequestMetadata } from "@/lib/request-metadata";
import { createNotification } from "@/lib/notifications";

export async function updateBookingInstructions(formData: FormData) {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const bookingId = String(formData.get("bookingId"));
  const notes = String(formData.get("notes"));

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, vendorId: userId }
  });

  if (!booking) return;

  const { ipAddress, userAgent } = await getRequestMetadata();

  await runWithAuditContext({ actorId: userId, actorRole: "vendor", ipAddress, userAgent }, async () => {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { notes }
    });
  });

  revalidatePath(`/vendor/bookings/${bookingId}`);
}

const ApprovePaymentSchema = z.object({
  paymentId: z.string().min(1)
});

export async function approvePayment(formData: FormData) {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  
  const parsed = ApprovePaymentSchema.safeParse({
    paymentId: String(formData.get("paymentId") ?? "")
  });

  if (!parsed.success) return;

  const { paymentId } = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { trip: true } } }
  });

  if (!payment || payment.booking.vendorId !== userId) return;

  const { ipAddress, userAgent } = await getRequestMetadata();

  await runWithAuditContext({ actorId: userId, actorRole: "vendor", ipAddress, userAgent }, async () => {
    // 1. Update Payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "paid" }
    });

    // 2. Create Conversation (if not exists? For now just create new one)
    // We check if a conversation already exists between these two users
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: payment.booking.trip.userId } } },
          { participants: { some: { userId } } }
        ]
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: payment.booking.trip.userId },
              { userId }
            ]
          }
        }
      });
    }

    // 3. Send System Message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId, // Vendor sends it
        content: `Payment of ${payment.currency} ${payment.amount} for Booking #${payment.booking.id.slice(-8)} has been confirmed. Communication channel open.`
      }
    });

    await createNotification(
      payment.booking.trip.userId,
      "payment_approved",
      "Payment Approved",
      `Your payment of ${payment.currency} ${payment.amount} for Booking #${payment.booking.id.slice(-8)} has been confirmed.`,
      { bookingId: payment.bookingId, tripId: payment.booking.tripId }
    );
  });

  revalidatePath(`/vendor/bookings/${payment.bookingId}`);
}

export async function declineBooking(formData: FormData) {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const bookingId = String(formData.get("bookingId"));

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, vendorId: userId },
    include: { trip: true }
  });

  if (!booking) return;

  const { ipAddress, userAgent } = await getRequestMetadata();

  await runWithAuditContext({ actorId: userId, actorRole: "vendor", ipAddress, userAgent }, async () => {
    // 1. Update Booking Status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "cancelled" }
    });

    // 2. Notify Traveler
    await createNotification(
      booking.trip.userId,
      "booking_declined",
      "Booking Update",
      `The vendor is unable to fulfill your booking #${booking.id.slice(-8)}.`,
      { bookingId: booking.id, tripId: booking.tripId }
    );
  });

  await appendAuditLog({
    actorId: userId,
    actorRole: "vendor",
    action: "BOOKING_DECLINED",
    resourceType: "Booking",
    resourceId: bookingId,
    oldValue: { status: booking.status },
    newValue: { status: "cancelled" }
  });

  revalidatePath(`/vendor/bookings/${bookingId}`);
}
