"use client";

import dynamic from "next/dynamic";
import { ActivityCard } from "./activity-card";
import type { ItineraryLinksConfig } from "@/lib/trip-layout";

const ItineraryMap = dynamic(() => import("@/components/itinerary-map"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-neutral-800/50 mt-4" />
});

type DayItem = {
  day: number;
  date?: string;
  items: {
    time?: string;
    name: string;
    description?: string;
    category?: string;
    location?: string;
    durationMinutes?: number;
    estimatedStartTime?: string;
    estimatedEndTime?: string;
    bufferTimeMinutes?: number;
    notes?: string;
    estimatedCost?: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }[];
};

export function DayTimeline({
  tripId,
  day,
  onChangeItem,
  onRemoveItem,
  currency,
  locale,
  linkSettings
}: {
  tripId: string;
  day: DayItem;
  onChangeItem?: (index: number, patch: Partial<DayItem["items"][number]>) => void;
  onRemoveItem?: (index: number) => void;
  currency?: string;
  locale?: string;
  linkSettings?: ItineraryLinksConfig;
}) {
  const coordinates = day.items
    .filter((item) => item.coordinates)
    .map((item) => ({
      lat: item.coordinates!.lat,
      lng: item.coordinates!.lng,
      name: item.name
    }));

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400">
          {day.day}
        </span>
        {day.date ? (
          <span>{day.date}</span>
        ) : (
          <span>Day {day.day}</span>
        )}
      </h2>
      <div className="space-y-0">
        {day.items.map((item, idx) => (
          <ActivityCard
            key={idx}
            tripId={tripId}
            item={item}
            currency={currency}
            locale={locale}
            linkSettings={linkSettings}
            onChange={onChangeItem ? (patch) => onChangeItem(idx, patch) : undefined}
            onRemove={onRemoveItem ? () => onRemoveItem(idx) : undefined}
          />
        ))}
      </div>
      
      {coordinates.length > 0 && <ItineraryMap coordinates={coordinates} />}
    </div>
  );
}
