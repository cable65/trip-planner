import { Clock, MapPin, Utensils, Camera, ShoppingBag, Mountain, Coffee, Trash2, Edit2, X, Check, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { useState } from "react";
import type { ItineraryLinksConfig } from "@/lib/trip-layout";
import { formatCurrency } from "@/lib/currency";

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
  coordinates?: { lat: number; lng: number };
  officialUrl?: string;
};

type ActivityExternalLink = {
  label: string;
  url: string;
};

const categoryIcons: Record<string, any> = {
  food: Utensils,
  culture: Camera,
  adventure: Mountain,
  shopping: ShoppingBag,
  nature: Mountain,
  relax: Coffee,
  default: MapPin
};

type ActivityCardProps = {
  tripId: string;
  item: ActivityItem;
  currency?: string;
  locale?: string;
  linkSettings?: ItineraryLinksConfig;
  onChange?: (patch: Partial<ActivityItem>) => void;
  onRemove?: () => void;
};

export function buildExternalLinksForActivity(
  item: ActivityItem,
  settings?: ItineraryLinksConfig
): ActivityExternalLink[] {
  const links: ActivityExternalLink[] = [];

  const locationText = item.location || item.name;

  const flags: ItineraryLinksConfig = settings || {
    showDirections: true,
    showMap: true,
    showMoreInfo: true
  };

  if (item.officialUrl) {
    links.push({
      label: "Official Site",
      url: item.officialUrl
    });
  }

  if (item.coordinates && flags.showDirections) {
    const query = encodeURIComponent(`${item.coordinates.lat},${item.coordinates.lng}`);
    links.push({
      label: "Directions",
      url: `https://www.google.com/maps/search/?api=1&query=${query}`
    });
  } else if (locationText && flags.showMap) {
    const query = encodeURIComponent(locationText);
    links.push({
      label: "View on Map",
      url: `https://www.google.com/maps/search/?api=1&query=${query}`
    });
  }

  if (locationText && flags.showMoreInfo) {
    const searchQuery = encodeURIComponent(`${locationText} travel information`);
    links.push({
      label: "More Info",
      url: `https://www.google.com/search?q=${searchQuery}`
    });
  }

  return links;
}

export function ActivityCard({ tripId, item, currency, locale, linkSettings, onChange, onRemove }: ActivityCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ActivityItem>(item);

  const Icon = categoryIcons[item.category?.toLowerCase() ?? ""] || categoryIcons.default;

  function handleStartEdit() {
    if (!onChange) return;
    setDraft(item);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(item);
    setEditing(false);
  }

  function handleSave() {
    if (!onChange) return;
    if (!draft.name.trim()) return;
    onChange(draft);
    setEditing(false);
  }

  function handleFieldChange(field: keyof ActivityItem, value: string) {
    if (field === "durationMinutes") {
      const num = Number(value);
      setDraft((prev) => ({ ...prev, durationMinutes: Number.isNaN(num) || num <= 0 ? undefined : num }));
      return;
    }
    if (field === "estimatedCost") {
      const num = Number(value);
      setDraft((prev) => ({ ...prev, estimatedCost: Number.isNaN(num) || num < 0 ? undefined : num }));
      return;
    }
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  const displayTime = item.time || (item.estimatedStartTime && item.estimatedEndTime ? `${item.estimatedStartTime} - ${item.estimatedEndTime}` : item.estimatedStartTime);

  function formatDuration(minutes?: number) {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  const externalLinks = buildExternalLinksForActivity(item, linkSettings);

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 ring-4 ring-neutral-950">
          <Icon className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="h-full w-px bg-neutral-800" />
      </div>
      <div className="flex-1 space-y-2 pb-2">
        {editing ? (
          <div className="space-y-2 rounded-lg border border-neutral-700 bg-neutral-900/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  className="w-24 rounded bg-neutral-950 px-2 py-1 text-xs text-neutral-100 ring-1 ring-neutral-700"
                  placeholder="Time (HH:mm)"
                  defaultValue={draft.time}
                  onChange={(e) => handleFieldChange("time", e.target.value)}
                />
                <input
                  className="min-w-[140px] flex-1 rounded bg-neutral-950 px-2 py-1 text-xs font-semibold text-neutral-100 ring-1 ring-neutral-700"
                  defaultValue={draft.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="w-20 rounded bg-neutral-950 px-2 py-1 text-xs text-neutral-100 ring-1 ring-neutral-700"
                  placeholder="Cost"
                  defaultValue={draft.estimatedCost ?? ""}
                  onChange={(e) => handleFieldChange("estimatedCost", e.target.value)}
                />
                <input
                  className="w-20 rounded bg-neutral-950 px-2 py-1 text-xs text-neutral-100 ring-1 ring-neutral-700"
                  placeholder="Min"
                  defaultValue={draft.durationMinutes ?? ""}
                  onChange={(e) => handleFieldChange("durationMinutes", e.target.value)}
                />
              </div>
            </div>
            <input
              className="w-full rounded bg-neutral-950 px-2 py-1 text-xs text-neutral-100 ring-1 ring-neutral-700"
              placeholder="Location"
              defaultValue={draft.location}
              onChange={(e) => handleFieldChange("location", e.target.value)}
            />
            <input
              className="w-full rounded bg-neutral-950 px-2 py-1 text-xs text-neutral-100 ring-1 ring-neutral-700"
              placeholder="Official site URL (https://...)"
              defaultValue={draft.officialUrl}
              onChange={(e) => handleFieldChange("officialUrl", e.target.value)}
            />
            <textarea
              className="w-full rounded bg-neutral-950 px-2 py-1 text-xs text-neutral-100 ring-1 ring-neutral-700"
              placeholder="Description"
              defaultValue={draft.description}
              rows={2}
              onChange={(e) => handleFieldChange("description", e.target.value)}
            />
            <textarea
              className="w-full rounded bg-neutral-950 px-2 py-1 text-xs text-neutral-100 ring-1 ring-neutral-700"
              placeholder="Notes"
              defaultValue={draft.notes}
              rows={2}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
            />
            <div className="flex flex-wrap justify-between gap-2 pt-1">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  <Check className="h-3 w-3" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1 rounded bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-200"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex items-center gap-1 rounded bg-neutral-900 px-3 py-1 text-xs font-semibold text-rose-300"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg bg-neutral-900/40 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                {displayTime && (
                  <span className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-xs font-medium text-neutral-300">
                    <Clock className="h-3 w-3" />
                    {displayTime}
                  </span>
                )}
                <h3 className="font-semibold text-neutral-100">{item.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                {item.durationMinutes && (
                  <span className="text-xs text-neutral-400">{formatDuration(item.durationMinutes)}</span>
                )}
                {item.estimatedCost !== undefined && item.estimatedCost > 0 && (
                  <span className="text-sm font-medium text-emerald-400">
                    {formatCurrency({ amount: item.estimatedCost, currency: currency || "USD", locale: locale || "en-US" })}
                  </span>
                )}
                {onChange && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-1 rounded bg-neutral-800 px-2 py-1 text-[10px] font-semibold text-neutral-200"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </button>
                )}
                {onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-rose-300"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            {item.location && (
              <div className="text-xs text-neutral-400">{item.location}</div>
            )}
            {item.description && (
              <p className="text-sm leading-relaxed text-neutral-400">{item.description}</p>
            )}
            {item.notes && (
              <p className="text-xs leading-relaxed text-neutral-500">{item.notes}</p>
            )}
            {externalLinks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {externalLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-indigo-300 hover:bg-neutral-700"
                    onClick={() => {
                      fetch(`/api/trips/${encodeURIComponent(tripId)}/track-link`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ label: link.label, url: link.url })
                      }).catch(() => {});
                    }}
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
