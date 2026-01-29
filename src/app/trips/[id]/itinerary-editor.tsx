"use client";

import { useState, useEffect } from "react";
import { DayTimeline } from "./day-timeline";
import { updateItinerary } from "./actions";
import { Undo2, Redo2, Plus, ArrowUpDown, Settings2 } from "lucide-react";
import { calculateDayTimes, sortDayActivities } from "@/lib/ai/itinerary-generator";
import { defaultPreferences } from "@/lib/preferences";
import type { ItineraryLinksConfig } from "@/lib/trip-layout";

type Coordinates = {
  lat: number;
  lng: number;
};

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
  coordinates?: Coordinates;
  officialUrl?: string;
};

type DayItem = {
  day: number;
  date?: string;
  items: ActivityItem[];
};

const templates: ActivityItem[] = [
  { name: "Breakfast", category: "food", time: "08:00" },
  { name: "City walking tour", category: "culture", time: "10:00" },
  { name: "Lunch", category: "food", time: "13:00" },
  { name: "Free time", category: "relax" }
];

function cloneDays(days: DayItem[]): DayItem[] {
  return JSON.parse(JSON.stringify(days));
}

function hasTimeConflict(items: ActivityItem[], time: string, indexToIgnore: number | null) {
  return items.some((item, index) => index !== indexToIgnore && item.time === time);
}

export function ItineraryEditor({
  tripId,
  initialDays,
  estimatedTotal,
  notes,
  currency,
  locale,
  linkSettings
}: {
  tripId: string;
  initialDays: DayItem[];
  estimatedTotal?: number;
  notes?: string[];
  currency?: string;
  locale?: string;
  linkSettings?: ItineraryLinksConfig;
}) {
  const [days, setDays] = useState<DayItem[]>(initialDays);
  const [undoStack, setUndoStack] = useState<DayItem[][]>([]);
  const [redoStack, setRedoStack] = useState<DayItem[][]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSort, setAutoSort] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [linkOverrides, setLinkOverrides] = useState<{
    showDirections?: boolean;
    showMap?: boolean;
    showMoreInfo?: boolean;
  }>(() => ({ }));

  // Initial calculation on mount
  useEffect(() => {
    setDays(prevDays => prevDays.map(day => calculateDayTimes(day as any, preferences) as any));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate when preferences change
  useEffect(() => {
    setDays(prevDays => prevDays.map(day => calculateDayTimes(day as any, preferences) as any));
  }, [preferences]);

  function handlePreferenceChange(key: keyof typeof defaultPreferences, value: any) {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }

  async function persist(nextDays: DayItem[]) {
    setSaving(true);
    setError(null);
    try {
      await updateItinerary(tripId, {
        days: nextDays,
        estimatedTotalCost: estimatedTotal,
        notes,
        itineraryLinksOverride:
          linkOverrides &&
          (linkOverrides.showDirections !== undefined ||
            linkOverrides.showMap !== undefined ||
            linkOverrides.showMoreInfo !== undefined)
            ? linkOverrides
            : undefined
      });
    } catch (e) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function pushState(nextDays: DayItem[]) {
    setUndoStack((prev) => [...prev, days]);
    setRedoStack([]);
    setDays(nextDays);
  }

  function processDay(day: DayItem, shouldSort: boolean = autoSort): DayItem {
    let processed = calculateDayTimes(day as any, preferences) as any as DayItem;
    if (shouldSort) {
      processed = sortDayActivities(processed as any) as any as DayItem;
      // Re-calculate after sort to ensure times flow correctly
      processed = calculateDayTimes(processed as any, preferences) as any as DayItem;
    }
    return processed;
  }

  async function handleUpdateItem(dayIndex: number, itemIndex: number, patch: Partial<ActivityItem>) {
    const currentDay = days[dayIndex];
    if (!currentDay) return;

    const nextDays = cloneDays(days);
    const target = nextDays[dayIndex].items[itemIndex];
    if (!target) return;

    const updated: ActivityItem = { ...target, ...patch };

    // If time is manually changed, we might want to check conflicts, but auto-calculation handles flows.
    // If autoSort is on, changing time might reorder.

    if (updated.time && hasTimeConflict(nextDays[dayIndex].items, updated.time, itemIndex)) {
      setError("Time conflict detected for this day.");
      // We continue anyway, user can fix it. Or return? 
      // User requirement says "Include time conflict detection". 
      // Previous implementation returned. I'll keep returning for now if it's a hard conflict on FIXED times.
      return;
    }

    nextDays[dayIndex].items[itemIndex] = updated;
    
    // Process the day (recalc times/sort)
    nextDays[dayIndex] = processDay(nextDays[dayIndex]);

    pushState(nextDays);
    await persist(nextDays);
  }

  async function handleRemoveItem(dayIndex: number, itemIndex: number) {
    const currentDay = days[dayIndex];
    if (!currentDay) return;

    if (!window.confirm("Remove this activity from the itinerary?")) return;

    const nextDays = cloneDays(days);
    nextDays[dayIndex].items.splice(itemIndex, 1);
    
    // Process the day (recalc times/sort)
    nextDays[dayIndex] = processDay(nextDays[dayIndex]);

    pushState(nextDays);
    await persist(nextDays);
  }

  async function handleAddItem(dayIndex: number, templateIndex: number | null) {
    const currentDay = days[dayIndex];
    if (!currentDay) return;

    const nextDays = cloneDays(days);
    let base: ActivityItem = {
      name: "Custom activity"
    };

    if (templateIndex !== null && templates[templateIndex]) {
      base = { ...templates[templateIndex] };
    }

    if (base.time && hasTimeConflict(nextDays[dayIndex].items, base.time, null)) {
      base.time = undefined;
    }

    nextDays[dayIndex].items.push(base);
    
    // Process the day (recalc times/sort)
    nextDays[dayIndex] = processDay(nextDays[dayIndex]);

    pushState(nextDays);
    await persist(nextDays);
  }

  async function handleUndo() {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const nextUndo = undoStack.slice(0, -1);
    setUndoStack(nextUndo);
    setRedoStack((prev) => [...prev, days]);
    setDays(previous);
    await persist(previous);
  }

  async function handleRedo() {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const nextRedo = redoStack.slice(0, -1);
    setRedoStack(nextRedo);
    setUndoStack((prev) => [...prev, days]);
    setDays(next);
    await persist(next);
  }

  function handleToggleAutoSort() {
    const nextAutoSort = !autoSort;
    setAutoSort(nextAutoSort);
    if (nextAutoSort) {
      // Trigger sort immediately
      const nextDays = days.map(day => processDay(day, true));
      pushState(nextDays);
      persist(nextDays);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0 || saving}
            className="inline-flex items-center gap-1 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 disabled:opacity-40"
          >
            <Undo2 className="h-3 w-3" />
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0 || saving}
            className="inline-flex items-center gap-1 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 disabled:opacity-40"
          >
            <Redo2 className="h-3 w-3" />
            Redo
          </button>
          <div className="h-4 w-px bg-neutral-800 mx-1" />
          <button
            type="button"
            onClick={handleToggleAutoSort}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              autoSort ? "bg-indigo-600 text-white" : "bg-neutral-800 text-neutral-200"
            }`}
          >
            <ArrowUpDown className="h-3 w-3" />
            Auto-Sort
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showSettings ? "bg-neutral-700 text-white" : "bg-neutral-800 text-neutral-200"
            }`}
          >
            <Settings2 className="h-3 w-3" />
          </button>
        </div>
        {saving && (
          <span className="text-xs text-neutral-400">Saving changes...</span>
        )}
      </div>

      {showSettings && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 mb-4">
          <h3 className="mb-3 text-sm font-semibold text-neutral-200">Itinerary Settings</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Day Start Time</label>
              <input
                type="time"
                value={preferences.dayStartTime}
                onChange={(e) => handlePreferenceChange("dayStartTime", e.target.value)}
                className="w-full rounded bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 ring-1 ring-neutral-800 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Default Buffer (min)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={preferences.defaultBufferMinutes}
                onChange={(e) => handlePreferenceChange("defaultBufferMinutes", Number(e.target.value))}
                className="w-full rounded bg-neutral-950 px-2 py-1.5 text-sm text-neutral-100 ring-1 ring-neutral-800 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="mt-4 border-t border-neutral-800 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-300">Link density overrides</div>
                <div className="text-xs text-neutral-500">
                  Override global link settings just for this trip.
                </div>
              </div>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {["showDirections", "showMap", "showMoreInfo"].map((key) => {
                const typedKey = key as keyof typeof linkOverrides;
                const label =
                  key === "showDirections"
                    ? "Directions"
                    : key === "showMap"
                    ? "Map"
                    : "More Info";
                const value = linkOverrides[typedKey];
                const enabled = value === undefined ? linkSettings?.[typedKey] ?? true : value;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setLinkOverrides((prev) => ({
                        ...prev,
                        [typedKey]: !(enabled)
                      }));
                    }}
                    className={`flex flex-col items-start rounded-lg border px-3 py-2 text-xs ${
                      enabled
                        ? "border-emerald-500/60 bg-emerald-500/5 text-neutral-50"
                        : "border-neutral-700 bg-neutral-900 text-neutral-400"
                    }`}
                  >
                    <span className="font-semibold">{label}</span>
                    <span className="mt-0.5 text-[10px] text-neutral-500">
                      {value === undefined ? "Using global" : enabled ? "Forced on" : "Forced off"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/5 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      <div className="space-y-6">
      {days.map((day, dayIndex) => (
          <div key={day.day} className="space-y-3">
            <DayTimeline
              tripId={tripId}
              day={day}
              currency={currency}
              locale={locale}
              linkSettings={linkSettings}
              onChangeItem={async (itemIndex, patch) => {
                await handleUpdateItem(dayIndex, itemIndex, patch);
              }}
              onRemoveItem={async (itemIndex) => {
                await handleRemoveItem(dayIndex, itemIndex);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddItem(dayIndex, null)}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-100"
              >
                <Plus className="h-3 w-3" />
                Add Activity
              </button>
              {templates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddItem(dayIndex, idx)}
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300"
                >
                  <Plus className="h-3 w-3" />
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

