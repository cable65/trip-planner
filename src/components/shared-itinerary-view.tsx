
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DayTimeline } from "@/app/trips/[id]/day-timeline";
import type { ItineraryLinksConfig } from "@/lib/trip-layout";

type ActivityItem = {
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
  officialUrl?: string;
};

type DayItem = {
  day: number;
  date?: string;
  items: ActivityItem[];
};

type SharedItineraryViewProps = {
  tripId: string;
  days: DayItem[];
  currency?: string;
  locale?: string;
  linkSettings?: ItineraryLinksConfig;
};

export function SharedItineraryView({
  tripId,
  days,
  currency,
  locale,
  linkSettings
}: SharedItineraryViewProps) {
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  function toggleDay(dayIndex: number) {
    const next = new Set(collapsedDays);
    if (next.has(dayIndex)) {
      next.delete(dayIndex);
    } else {
      next.add(dayIndex);
    }
    setCollapsedDays(next);
  }

  if (!days || days.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
        No itinerary details available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Daily Itinerary</h2>
      <div className="space-y-4">
        {days.map((day, idx) => {
          const isCollapsed = collapsedDays.has(idx);
          return (
            <div key={idx} className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
              <button
                onClick={() => toggleDay(idx)}
                className="flex w-full items-center justify-between bg-neutral-800/50 px-6 py-4 text-left transition hover:bg-neutral-800"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="h-5 w-5 text-neutral-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-neutral-400" />
                  )}
                  <div className="font-semibold text-white">
                    Day {day.day}
                    {day.date && <span className="ml-2 font-normal text-neutral-400">{day.date}</span>}
                  </div>
                </div>
                <div className="text-sm text-neutral-400">
                  {day.items.length} Activities
                </div>
              </button>
              
              {!isCollapsed && (
                <div className="p-6 pt-2">
                  <DayTimeline
                    tripId={tripId}
                    day={day}
                    currency={currency}
                    locale={locale}
                    linkSettings={linkSettings}
                    // Read-only mode: no onChangeItem or onRemoveItem provided
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
