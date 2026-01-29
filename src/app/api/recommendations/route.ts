import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // 1. Get User's Trips to find their destination and interests
  const userTrips = await prisma.trip.findMany({
    where: { userId, status: { not: "cancelled" } },
    select: { destination: true, interests: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const recentDestinations = userTrips.map(t => t.destination);
  const userInterests = Array.from(new Set(userTrips.flatMap(t => t.interests)));

  if (recentDestinations.length === 0) {
      return NextResponse.json([]);
  }

  // 2. Find Packages that match destination OR interests
  // Since our Package schema doesn't have explicit tags yet, we search in description/name
  // Ideally, we'd add tags to VendorPackage. For now, let's filter by vendor location (if we can join) 
  // or simple text match.
  
  // Let's try to match packages from vendors whose profile location matches the trip destination
  const packages = await (prisma as any).vendorPackage.findMany({
    where: {
      isApproved: true,
      OR: [
        // Match Vendor Location to Trip Destination
        {
          vendor: {
            vendorProfile: {
               location: { in: recentDestinations, mode: "insensitive" }
            }
          }
        },
        // Simple text search in package name/description for interests
        ...userInterests.map(interest => ({
           OR: [
             { name: { contains: interest, mode: "insensitive" } },
             { description: { contains: interest, mode: "insensitive" } }
           ]
        }))
      ]
    },
    take: 6,
    include: {
      vendor: {
        select: {
          name: true,
          vendorProfile: { select: { location: true, logoUrl: true } }
        }
      }
    }
  });

  return NextResponse.json(packages);
}
