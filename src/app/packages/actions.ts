"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { getRequestMetadata } from "@/lib/request-metadata";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

const BookPackageSchema = z.object({
  packageId: z.string().min(1),
  tripId: z.string().min(1),
  date: z.string().min(1),
});

export async function bookPackage(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = BookPackageSchema.safeParse({
    packageId: String(formData.get("packageId") ?? ""),
    tripId: String(formData.get("tripId") ?? ""),
    date: String(formData.get("date") ?? "")
  });

  if (!parsed.success) {
    throw new Error("Invalid input");
  }

  const { packageId, tripId, date } = parsed.data;
  const bookingDate = new Date(date);

  // Verify trip ownership
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: actorId }
  });
  if (!trip) throw new Error("Trip not found or access denied");

  // Verify package
  const pkg = await (prisma as any).vendorPackage.findUnique({
    where: { id: packageId },
    include: { availability: true }
  });
  if (!pkg) throw new Error("Package not found");
  if (!pkg.isApproved || pkg.isArchived) throw new Error("Package is not available for booking");

  // Check availability
  const isAvailable = pkg.availability.some((a: any) => 
    bookingDate >= new Date(a.dateFrom) && 
    bookingDate <= new Date(a.dateTo) &&
    a.quantity > 0
  );

  if (!isAvailable) {
    throw new Error("Selected date is not available");
  }

  // Create Booking
  const booking = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.booking.create({
        data: {
          tripId,
          vendorId: pkg.vendorId,
          type: `Package: ${pkg.name}`,
          price: pkg.priceCents,
          startDate: bookingDate,
          endDate: bookingDate, // Single day for now, or could imply duration from package details
          status: "confirmed" // Instant confirmation
        }
      })
  );

  // Update Package Metrics
  await prisma.packageMetric.upsert({
    where: { packageId },
    update: {
      bookings: { increment: 1 },
      revenue: { increment: pkg.priceCents }
    },
    create: {
      packageId,
      bookings: 1,
      revenue: pkg.priceCents
    }
  });

  // Send Notification to Vendor
  await createNotification(
    pkg.vendorId,
    "new_booking",
    "New Booking!",
    `You have a new booking for ${pkg.name} on ${bookingDate.toLocaleDateString()}`,
    { bookingId: booking.id, tripId }
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "BOOKING_CREATED_FROM_PACKAGE",
    resourceType: "Booking",
    resourceId: booking.id,
    oldValue: null,
    newValue: {
      tripId,
      packageId,
      price: pkg.priceCents,
      vendorId: pkg.vendorId,
      date: bookingDate
    },
    metadata: { packageId }
  });

  redirect(`/trips/${tripId}`);
}
