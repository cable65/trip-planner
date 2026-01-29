"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { getRequestMetadata } from "@/lib/request-metadata";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { saveUploadedFile } from "@/lib/file-upload";
import { createNotification } from "@/lib/notifications";

const CreatePaymentSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  currency: z.string().min(3).max(3).toUpperCase()
});

const UpdateBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["pending", "confirmed", "cancelled", "refunded"])
});

export async function createPayment(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = CreatePaymentSchema.safeParse({
    bookingId: String(formData.get("bookingId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? "USD")
  });

  if (!parsed.success) return;

  const { bookingId, amount, currency } = parsed.data;

  // Verify ownership
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true }
  });

  if (!booking || booking.trip.userId !== actorId) return;

  const payment = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.payment.create({
        data: {
          userId: actorId,
          bookingId,
          amount,
          currency,
          status: "paid" // Defaulting to paid for manual entry, or could be pending
        }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "PAYMENT_CREATED",
    resourceType: "Payment",
    resourceId: payment.id,
    oldValue: null,
    newValue: { id: payment.id, amount, currency, status: payment.status }
  });

  revalidatePath(`/trips/${booking.tripId}/bookings/${bookingId}`);
}

export async function shareItineraryWithVendor(formData: FormData) {
  const session = await requireUser();
  const userId = (session.user as any).id as string;
  const bookingId = String(formData.get("bookingId"));

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true }
  });

  if (!booking || booking.trip.userId !== userId || !booking.vendorId) return;

  const itinerary = booking.trip.itinerary as any;
  const days = Array.isArray(itinerary?.days) ? itinerary.days : [];
  
  if (days.length === 0) return;

  // Format itinerary as text
  let content = `Here is my daily itinerary for the trip:\n\n`;
  days.forEach((day: any, index: number) => {
    content += `Day ${index + 1}:\n`;
    if (Array.isArray(day.activities)) {
      day.activities.forEach((act: any) => {
        content += `- ${act.time ? act.time + ": " : ""}${act.description}\n`;
      });
    }
    content += `\n`;
  });

  // Check for existing conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: userId } } },
        { participants: { some: { userId: booking.vendorId } } }
      ]
    }
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: booking.vendorId }]
        }
      }
    });
  }

  // Send message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: userId,
      content
    }
  });

  await createNotification(
    booking.vendorId,
    "new_message",
    "Itinerary Shared",
    `${session.user?.name || "Traveler"} shared their itinerary with you.`,
    { conversationId: conversation.id }
  );

  redirect(`/messages/${conversation.id}`);
}

export async function updateBookingStatus(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = UpdateBookingStatusSchema.safeParse({
    bookingId: String(formData.get("bookingId") ?? ""),
    status: String(formData.get("status") ?? "")
  });

  if (!parsed.success) return;

  const { bookingId, status } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true }
  });

  if (!booking || booking.trip.userId !== actorId) return;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.booking.update({
        where: { id: bookingId },
        data: { status }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "BOOKING_STATUS_UPDATED",
    resourceType: "Booking",
    resourceId: bookingId,
    oldValue: { status: booking.status },
    newValue: { status }
  });

  revalidatePath(`/trips/${booking.tripId}/bookings/${bookingId}`);
}

const RefundPaymentSchema = z.object({
  paymentId: z.string().min(1)
});

export async function refundPayment(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = RefundPaymentSchema.safeParse({
    paymentId: String(formData.get("paymentId") ?? "")
  });
  if (!parsed.success) return;

  const { paymentId } = parsed.data;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { trip: true } } }
  });
  if (!payment || payment.booking.trip.userId !== actorId) return;

  const updated = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: "refunded" }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "PAYMENT_REFUNDED",
    resourceType: "Payment",
    resourceId: paymentId,
    oldValue: { status: payment.status },
    newValue: { status: updated.status }
  });

  revalidatePath(`/trips/${payment.booking.tripId}/bookings/${payment.bookingId}`);
}

const SubmitProofSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  currency: z.string().min(3).max(3).toUpperCase()
});

export async function submitPaymentProof(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = SubmitProofSchema.safeParse({
    bookingId: String(formData.get("bookingId") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? "USD")
  });

  if (!parsed.success) return;

  const { bookingId, amount, currency } = parsed.data;
  const proofFile = formData.get("proof") as File;

  if (!proofFile || proofFile.size === 0) return;

  // Verify ownership
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true }
  });

  if (!booking || booking.trip.userId !== actorId) return;

  // Upload File
  const proofUrl = await saveUploadedFile(proofFile, "document");
  if (!proofUrl) return;

  const payment = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.payment.create({
        data: {
          userId: actorId,
          bookingId,
          amount,
          currency,
          status: "pending", // Pending vendor approval
          metadata: { proofUrl }
        }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "PAYMENT_PROOF_SUBMITTED",
    resourceType: "Payment",
    resourceId: payment.id,
    oldValue: null,
    newValue: { id: payment.id, amount, currency, status: "pending" },
    metadata: { proofUrl }
  });

  if (booking.vendorId) {
    await createNotification(
      booking.vendorId,
      "payment_proof",
      "Payment Proof Uploaded",
      `A traveler has uploaded payment proof for Booking #${bookingId.slice(-8)}. Please verify.`,
      { bookingId, paymentId: payment.id }
    );
  }

  revalidatePath(`/trips/${booking.tripId}/bookings/${bookingId}`);
}
