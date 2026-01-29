"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";
import { runWithAuditContext } from "@/lib/audit-context";
import { getRequestMetadata } from "@/lib/request-metadata";
import { appendAuditLog } from "@/lib/audit";
import { generateItinerary } from "@/lib/ai/itinerary";
import { CreateTripSchema } from "@/lib/schemas";


export type State = {
  message?: string | null;
  errors?: {
    destination?: string[];
    startDate?: string[];
    endDate?: string[];
    budget?: string[];
    interests?: string[];
    travelStyle?: string[];
  };
};

export async function createTripFromAi(prevState: State, formData: FormData): Promise<State> {
  const session = await requireUser();
  const actorId = (session.user as any).id as string;
  const actorRole = (session.user as any).role as string;
  const { ipAddress, userAgent } = await getRequestMetadata();

  const interestsList = formData.getAll("interests").map(String);
  const parsed = CreateTripSchema.safeParse({
    destination: String(formData.get("destination") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    budget: formData.get("budget") ? String(formData.get("budget")) : undefined,
    pax: formData.get("pax") ? Number(formData.get("pax")) : 1,
    interests: interestsList.join(","),
    travelStyle: String(formData.get("travelStyle") ?? "") || undefined
  });
  
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the errors below."
    };
  }

  const interests = parsed.data.interests.includes(",")
    ? parsed.data.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12)
    : [parsed.data.interests];

  let itinerary: any;
  try {
    itinerary = await generateItinerary({
      destination: parsed.data.destination,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      budget: parsed.data.budget,
      pax: parsed.data.pax,
      interests,
      travelStyle: parsed.data.travelStyle
    });
  } catch (error: any) {
    console.error("generateItinerary failed:", error?.message || error);
    const message =
      error && typeof error.message === "string"
        ? error.message
        : "Failed to generate itinerary. Please try again later.";
    return { message };
  }

  // Fetch destination image
  const dest = await prisma.destination.findFirst({
    where: {
      name: { equals: parsed.data.destination, mode: "insensitive" }
    }
  });
  const imageUrl = dest?.imageUrl;

  const trip = await runWithAuditContext(
    { actorId, actorRole, ipAddress, userAgent },
    () =>
      prisma.trip.create({
        data: {
          userId: actorId,
          destination: parsed.data.destination,
          imageUrl,
          startDate: new Date(parsed.data.startDate),
          endDate: new Date(parsed.data.endDate),
          budget: parsed.data.budget,
          pax: parsed.data.pax,
          interests,
          travelStyle: parsed.data.travelStyle,
          itinerary,
          status: "planned"
        }
      })
  );

  await appendAuditLog({
    actorId,
    actorRole,
    action: "AI_TRIP_GENERATED",
    resourceType: "Trip",
    resourceId: trip.id,
    oldValue: null,
    newValue: { id: trip.id, destination: trip.destination, status: trip.status }
  });

  redirect(`/trips/${trip.id}`);
}

