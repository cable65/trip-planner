import { z } from "zod";
import { ItinerarySchema } from "./itinerary";
import { defaultPreferences, ItineraryPreferences } from "@/lib/preferences";

type Itinerary = z.infer<typeof ItinerarySchema>;
type Day = Itinerary["days"][number];
type Item = Day["items"][number];

// Helper to parse "HH:mm" or "h:mm A" to minutes from midnight
function timeToMinutes(time: string): number {
  if (!time) return 0;
  
  // Handle 12h format (e.g., "9:00 AM", "10:30 PM")
  if (time.match(/am|pm/i)) {
    const [t, modifier] = time.split(' ');
    let [hours, minutes] = t.split(':').map(Number);
    if (modifier.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Handle 24h format
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper to format minutes to 24-hour "HH:mm"
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function calculateDayTimes(
  day: Day,
  prefs: ItineraryPreferences = defaultPreferences
): Day {
  const items = [...day.items];
  let currentMinutes = timeToMinutes(prefs.dayStartTime);

  // First pass: Fill in duration if missing
  const itemsWithDuration = items.map((item) => {
    let duration = item.durationMinutes;
    if (!duration) {
      const category = item.category?.toLowerCase() || "default";
      // Simple partial match or default
      const matchedCategory = Object.keys(prefs.defaultDurationMinutes).find(k => category.includes(k)) || "default";
      duration = prefs.defaultDurationMinutes[matchedCategory];
    }
    const buffer = item.bufferTimeMinutes ?? prefs.defaultBufferMinutes;
    return { ...item, durationMinutes: duration, bufferTimeMinutes: buffer };
  });

  // Second pass: Calculate start/end times
  const calculatedItems = itemsWithDuration.map((item) => {
    let startMinutes = currentMinutes;
    
    if (item.time) {
      const fixedStart = timeToMinutes(item.time);
      startMinutes = fixedStart;
    }

    const endMinutes = startMinutes + (item.durationMinutes || 60);
    currentMinutes = endMinutes + (item.bufferTimeMinutes || 0);

    return {
      ...item,
      estimatedStartTime: minutesToTime(startMinutes),
      estimatedEndTime: minutesToTime(endMinutes)
    };
  });

  return {
    ...day,
    items: calculatedItems
  };
}

export function sortDayActivities(day: Day): Day {
  // Sort by estimatedStartTime
  // Note: This relies on calculateDayTimes having been run first to populate estimatedStartTime
  // If estimatedStartTime is missing, we might treat it as 0 or keep relative order?
  // Ideally, we run calculation, then sort, then maybe calculation again?
  
  // Strategy:
  // 1. Separate items with explicit 'time' and those without.
  // 2. If we want to purely sort by time, we need times for everything.
  // 3. If we sort by 'estimatedStartTime', we trust the calculation.
  
  const sortedItems = [...day.items].sort((a, b) => {
    const timeA = a.time || a.estimatedStartTime || "00:00";
    const timeB = b.time || b.estimatedStartTime || "00:00";
    return timeToMinutes(timeA) - timeToMinutes(timeB);
  });

  return {
    ...day,
    items: sortedItems
  };
}

export function recalculateItinerary(
  itinerary: Itinerary,
  prefs: ItineraryPreferences = defaultPreferences
): Itinerary {
  const newDays = itinerary.days.map(day => calculateDayTimes(day, prefs));
  return {
    ...itinerary,
    days: newDays
  };
}
