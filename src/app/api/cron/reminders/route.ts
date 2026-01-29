import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Check for secret key to secure cron jobs
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
  const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

  // Find bookings starting tomorrow
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      startDate: {
        gte: tomorrowStart,
        lte: tomorrowEnd,
      },
      status: "confirmed",
    },
    include: {
      trip: { select: { userId: true, destination: true } },
    },
  });

  let count = 0;

  for (const booking of upcomingBookings) {
    // Check if notification already exists to avoid duplicates (optional but good practice)
    const exists = await prisma.notification.findFirst({
      where: {
        userId: booking.trip.userId,
        type: "booking_reminder",
        data: { path: ["bookingId"], equals: booking.id },
      },
    });

    if (!exists) {
      await prisma.notification.create({
        data: {
          userId: booking.trip.userId,
          type: "booking_reminder",
          title: "Upcoming Booking Reminder",
          message: `Your booking for ${booking.type} in ${booking.trip.destination} is scheduled for tomorrow!`,
          data: { bookingId: booking.id, tripId: booking.tripId },
        },
      });
      count++;
    }
  }

  return NextResponse.json({ processed: upcomingBookings.length, notificationsSent: count });
}
