import { z } from "zod";
import { chatJson } from "@/lib/ai/client";

export const ItinerarySchema = z.object({
  title: z.string(),
  destination: z.string(),
  days: z.array(
    z.object({
      day: z.number().int().min(1),
      date: z.string().optional(),
      items: z.array(
        z.object({
          time: z.string().optional(),
          name: z.string(),
          description: z.string().optional(),
          category: z.string().optional(),
          location: z.string().optional(),
          durationMinutes: z.number().int().positive().optional(),
          estimatedStartTime: z.string().optional(), // HH:mm format
          estimatedEndTime: z.string().optional(),   // HH:mm format
          bufferTimeMinutes: z.number().int().nonnegative().optional(),
          notes: z.string().optional(),
          coordinates: z.object({
            lat: z.number(),
            lng: z.number()
          }).optional(),
          estimatedCost: z.number().optional(),
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

export async function generateItinerary(params: {
  destination: string;
  startDate: Date;
  endDate: Date;
  budget?: number | null;
  pax?: number;
  interests: string[];
  travelStyle?: string | null;
}) {
  const duration = Math.ceil(
    (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const raw = await chatJson(
    z.any(),
    `Plan a ${duration}-day trip to ${params.destination} for ${params.pax || 1} person(s).
    Budget: ${params.budget ? params.budget + " (Total)" : "Not specified"}.
    Interests: ${params.interests.join(", ")}.
    Travel Style: ${params.travelStyle || "Any"}.

    Output strictly valid JSON matching this structure (all fields optional unless specified):
    {
      "title": "Trip Title",
      "destination": "City, Country",
      "estimatedTotalCost": 1234 (number),
      "notes": ["note 1", "note 2"],
      "itineraryLinksOverride": {
        "showDirections": true,
        "showMap": true,
        "showMoreInfo": false
      },
      "days": [
        {
          "day": 1,
          "items": [
            {
              "name": "Place Name",
              "description": "Brief description",
              "category": "Food|Sightseeing|etc",
              "location": "Neighborhood or exact address",
              "coordinates": { "lat": 12.34, "lng": 56.78 },
              "estimatedCost": 50 (number),
              "officialUrl": "https://example.com/official-site"
            }
          ]
        }
      ]
    }

    Ensure the itinerary is realistic and covers ${duration} days.`
  );

  const obj = (raw && typeof raw === "object" ? raw : {}) as any;

  const title = typeof obj.title === "string" && obj.title.trim()
    ? obj.title.trim()
    : `${params.destination} Trip`;

  const destination = typeof obj.destination === "string" && obj.destination.trim()
    ? obj.destination.trim()
    : params.destination;

  const daysSrc = Array.isArray(obj.days) ? obj.days : [];

  const days = daysSrc.map((d: any, index: number) => {
    const dayNumber = typeof d?.day === "number" && Number.isFinite(d.day)
      ? d.day
      : index + 1;

    const itemsSrc = Array.isArray(d?.items) ? d.items : [];
    const items = itemsSrc
      .filter((it: any) => typeof it?.name === "string" && it.name.trim())
      .map((it: any) => {
        const durationMinutes =
          typeof it.durationMinutes === "number" && Number.isFinite(it.durationMinutes)
            ? it.durationMinutes
            : undefined;

        const bufferTimeMinutes =
          typeof it.bufferTimeMinutes === "number" && Number.isFinite(it.bufferTimeMinutes)
            ? it.bufferTimeMinutes
            : undefined;

        const estimatedCost =
          typeof it.estimatedCost === "number" && Number.isFinite(it.estimatedCost)
            ? it.estimatedCost
            : undefined;

        let coordinates: { lat: number; lng: number } | undefined;
        if (it.coordinates && typeof it.coordinates === "object") {
          const lat = Number((it.coordinates as any).lat);
          const lng = Number((it.coordinates as any).lng);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            coordinates = { lat, lng };
          }
        }

        let officialUrl: string | undefined;
        if (typeof it.officialUrl === "string") {
          const raw = it.officialUrl.trim();
          if (raw && /^https?:\/\//i.test(raw)) {
            officialUrl = raw;
          }
        }

        return {
          time: typeof it.time === "string" ? it.time : undefined,
          name: it.name.trim(),
          description: typeof it.description === "string" ? it.description : undefined,
          category: typeof it.category === "string" ? it.category : undefined,
          location: typeof it.location === "string" ? it.location : undefined,
          durationMinutes,
          estimatedStartTime:
            typeof it.estimatedStartTime === "string" ? it.estimatedStartTime : undefined,
          estimatedEndTime:
            typeof it.estimatedEndTime === "string" ? it.estimatedEndTime : undefined,
          bufferTimeMinutes,
          notes: typeof it.notes === "string" ? it.notes : undefined,
          coordinates,
          estimatedCost,
          officialUrl
        };
      });

    return {
      day: dayNumber,
      date: typeof d?.date === "string" ? d.date : undefined,
      items
    };
  });

  const estimatedTotalCost =
    typeof obj.estimatedTotalCost === "number" && Number.isFinite(obj.estimatedTotalCost)
      ? obj.estimatedTotalCost
      : undefined;

  const notes = Array.isArray(obj.notes)
    ? obj.notes.map((n: any) => String(n)).filter((n: string) => n.trim())
    : undefined;

  const itineraryLinksOverride =
    obj.itineraryLinksOverride && typeof obj.itineraryLinksOverride === "object"
      ? {
          showDirections:
            typeof obj.itineraryLinksOverride.showDirections === "boolean"
              ? obj.itineraryLinksOverride.showDirections
              : undefined,
          showMap:
            typeof obj.itineraryLinksOverride.showMap === "boolean"
              ? obj.itineraryLinksOverride.showMap
              : undefined,
          showMoreInfo:
            typeof obj.itineraryLinksOverride.showMoreInfo === "boolean"
              ? obj.itineraryLinksOverride.showMoreInfo
              : undefined
        }
      : undefined;

  return ItinerarySchema.parse({
    title,
    destination,
    days,
    estimatedTotalCost,
    notes,
    itineraryLinksOverride
  });
}

