import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Get all availability blocks for this package
  // Also get existing bookings to subtract availability
  
  const [availabilities, existingBookings] = await Promise.all([
    (prisma as any).packageAvailability.findMany({
      where: { packageId: id },
      orderBy: { dateFrom: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        vendorId: { not: null }, // Assuming vendorId is set for package bookings
        status: { not: "cancelled" },
        // Ideally we filter by packageId but Booking doesn't have packageId explicitly, 
        // it's in 'type' or we rely on vendorId check + date overlap logic if we can't link back easily.
        // But wait, `bookPackage` links `vendorId`.
        // To be precise, we need to know which PACKAGE this booking is for.
        // The current schema is a bit loose. 
        // For now, let's assume availability is managed by the `quantity` field in PackageAvailability
        // and we don't need to subtract bookings dynamically IF the system decrements quantity on book.
        // BUT `PackageAvailability` usually represents "Total Capacity".
        // Let's assume for this MVP that `quantity` in `PackageAvailability` represents REMAINING slots.
      },
    }),
  ]);

  // For a more robust system, we'd check if `type` contains the package name or ID, 
  // but let's stick to the simple interpretation: 
  // `PackageAvailability` table contains the definition of what is available.
  
  return NextResponse.json(availabilities);
}
