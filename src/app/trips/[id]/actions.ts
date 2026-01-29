"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { getRequestMetadata } from "@/lib/request-metadata";
import { runWithAuditContext } from "@/lib/audit-context";
import { appendAuditLog } from "@/lib/audit";
import { generateItinerary, ItinerarySchema } from "@/lib/ai/itinerary";
import { getOrGenerateTripImage } from "@/lib/ai/image-generator";

const UpdateTripSchema = z.object({
  tripId: z.string().min(1),
  destination: z.string().min(2).max(120),
  startDate: z.string().min(10).max(10),
  endDate: z.string().min(10).max(10),
  budget: z.string().optional(),
  pax: z.coerce.number().int().min(1).max(99).default(1),
  interests: z.string().min(1),
  travelStyle: z.string().max(60).optional()
});

const TripIdSchema = z.object({
  tripId: z.string().min(1)
});

const ItineraryUpdateSchema = z.object({
  days: z.array(
    z.object({
      day: z.number().int().min(1),
      date: z.string().optional(),
      items: z.array(
        z.object({
          time: z.string().optional(),
          name: z.string().min(1),
          description: z.string().optional(),
          category: z.string().optional(),
          location: z.string().optional(),
          durationMinutes: z.number().int().positive().optional(),
          notes: z.string().optional(),
          estimatedCost: z.number().optional(),
          coordinates: z
            .object({
              lat: z.number(),
              lng: z.number()
            })
            .optional()
          ,
          officialUrl: z.string().url().optional()
        })
      )
    })
  ),
  estimatedTotalCost: z.number().optional(),
  notes: z.array(z.string()).optional(),
  itineraryLinksOverride: z
    .object({
      showDirections: z.boolean().optional(),
      showMap: z.boolean().optional(),
      showMoreInfo: z.boolean().optional()
    })
    .optional()
});

export async function updateTrip(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const interestsValues = (formData.getAll("interests") as string[]).filter(Boolean);
  const parsed = UpdateTripSchema.safeParse({
    tripId: String(formData.get("tripId") ?? ""),
    destination: String(formData.get("destination") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    budget: formData.get("budget") ? String(formData.get("budget")) : undefined,
    pax: formData.get("pax") ? Number(formData.get("pax")) : 1,
    interests: interestsValues.length > 0 ? interestsValues.join(",") : String(formData.get("interests") ?? ""),
    travelStyle: String(formData.get("travelStyle") ?? "") || undefined
  });
  if (!parsed.success) return;

  const { tripId, destination, startDate, endDate } = parsed.data;
  const budget = parsed.data.budget ? Number(parsed.data.budget) : undefined;
  const interests = parsed.data.interests
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const existing = await prisma.trip.findFirst({
    where: { id: tripId, userId: actorId }
  });
  if (!existing) return;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.trip.update({
        where: { id: tripId },
        data: {
          destination,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          budget,
          pax: parsed.data.pax,
          interests,
          travelStyle: parsed.data.travelStyle
        }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "TRIP_UPDATED",
    resourceType: "Trip",
    resourceId: tripId,
    oldValue: {
      id: existing.id,
      destination: existing.destination,
      startDate: existing.startDate,
      endDate: existing.endDate,
      budget: existing.budget,
      pax: existing.pax,
      interests: existing.interests,
      travelStyle: existing.travelStyle
    },
    newValue: {
      id: existing.id,
      destination,
      startDate,
      endDate,
      budget,
      pax: parsed.data.pax,
      interests,
      travelStyle: parsed.data.travelStyle
    }
  });

  redirect(`/trips/${tripId}`);
}

export async function regenerateTrip(formData: FormData) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = TripIdSchema.safeParse({
    tripId: String(formData.get("tripId") ?? "")
  });
  if (!parsed.success) return;

  const { tripId } = parsed.data;

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: actorId }
  });
  if (!trip) return;

  let itinerary: any;
  try {
    itinerary = await generateItinerary({
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget ?? undefined,
      pax: trip.pax,
      interests: trip.interests,
      travelStyle: trip.travelStyle ?? undefined
    });
  } catch {
    return;
  }

  const previousItinerary = trip.itinerary;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.trip.update({
        where: { id: tripId },
        data: {
          itinerary
        }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "AI_TRIP_REGENERATED",
    resourceType: "Trip",
    resourceId: tripId,
    oldValue: { itinerary: previousItinerary },
    newValue: { itinerary }
  });

  redirect(`/trips/${tripId}`);
}

export async function generateTripImageAction(tripId: string, force = false) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: actorId }
  });
  if (!trip) throw new Error("Trip not found");

  const imageUrl = await getOrGenerateTripImage(trip.destination, tripId, actorId, force);

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.trip.update({
        where: { id: tripId },
        data: { imageUrl }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "AI_IMAGE_GENERATED",
    resourceType: "Trip",
    resourceId: tripId,
    oldValue: { imageUrl: trip.imageUrl },
    newValue: { imageUrl }
  });
  
  redirect(`/trips/${tripId}`);
}

export async function updateItinerary(tripId: string, payload: unknown) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const parsed = ItineraryUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return;
  }

  const itineraryCandidate = {
    title: "",
    destination: "",
    days: parsed.data.days,
    estimatedTotalCost: parsed.data.estimatedTotalCost,
    notes: parsed.data.notes,
    itineraryLinksOverride: parsed.data.itineraryLinksOverride
  };

  const validated = ItinerarySchema.safeParse(itineraryCandidate);
  if (!validated.success) {
    return;
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: actorId }
  });
  if (!trip) {
    return;
  }

  const previousItinerary = trip.itinerary as any;

  await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    async () => {
      const lastRevision = await prisma.itineraryRevision.findFirst({
        where: { tripId },
        orderBy: { version: "desc" }
      });

      let nextVersion = 1;

      if (!lastRevision) {
        await prisma.itineraryRevision.create({
          data: {
            tripId,
            version: 1,
            data: previousItinerary,
            actorId
          }
        });
        nextVersion = 2;
      } else {
        nextVersion = lastRevision.version + 1;
      }

      await prisma.itineraryRevision.create({
        data: {
          tripId,
          version: nextVersion,
          data: validated.data,
          actorId
        }
      });

      await prisma.trip.update({
        where: { id: tripId },
        data: {
          itinerary: validated.data
        }
      });
    }
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "ITINERARY_UPDATED",
    resourceType: "Trip",
    resourceId: tripId,
    oldValue: { itinerary: previousItinerary },
    newValue: { itinerary: validated.data }
  });
}

const ExportTripFinanceSchema = z.object({
  tripId: z.string().min(1),
  status: z.enum(["pending", "confirmed", "cancelled", "refunded"]).optional()
});

export async function exportTripFinance(params: {
  tripId: string;
  status?: string;
}) {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;

  const parsed = ExportTripFinanceSchema.safeParse(params);
  if (!parsed.success) return [] as Record<string, string>[];

  const { tripId, status } = parsed.data;

  const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: actorId } });
  if (!trip) return [] as Record<string, string>[];

  const bookings = await prisma.booking.findMany({
    where: { tripId, ...(status ? { status } : {}) },
    include: { payments: true },
    orderBy: { createdAt: "desc" }
  });

  const rows: Record<string, string>[] = [];
  for (const b of bookings) {
    if (b.payments.length === 0) {
      rows.push({
        bookingId: b.id,
        bookingType: b.type,
        bookingStatus: b.status,
        bookingPrice: String(b.price),
        paymentId: "",
        paymentAmount: "",
        paymentCurrency: "",
        paymentStatus: "",
        paymentDate: ""
      });
      continue;
    }
    for (const p of b.payments) {
      rows.push({
        bookingId: b.id,
        bookingType: b.type,
        bookingStatus: b.status,
        bookingPrice: String(b.price),
        paymentId: p.id,
        paymentAmount: String(p.amount),
        paymentCurrency: p.currency,
        paymentStatus: p.status,
        paymentDate: p.createdAt.toISOString()
      });
    }
  }

  return rows;
}

