export type TripSummaryBlockId =
  | "tripFinances"
  | "regenerate"
  | "notes"
  | "bookings"
  | "vendorQuotes";

export type ItineraryLinksConfig = {
  showDirections: boolean;
  showMap: boolean;
  showMoreInfo: boolean;
};

export type TripLayoutVisibility = {
  tripFinances: boolean;
  bookings: boolean;
  itineraryLinks: ItineraryLinksConfig;
};

export type TripLayoutVisibilityUpdate = {
  tripFinances?: boolean;
  bookings?: boolean;
  itineraryLinks?: Partial<ItineraryLinksConfig>;
};

export type TripLayoutConfig = {
  version: number;
  visibility: TripLayoutVisibility;
  sequence: TripSummaryBlockId[];
};

export const ALL_TRIP_SUMMARY_BLOCK_IDS: TripSummaryBlockId[] = [
  "tripFinances",
  "regenerate",
  "notes",
  "bookings",
  "vendorQuotes"
];

export const REQUIRED_TRIP_SUMMARY_BLOCK_IDS: TripSummaryBlockId[] = [
  "tripFinances",
  "bookings"
];

export const DEFAULT_ITINERARY_LINKS_CONFIG: ItineraryLinksConfig = {
  showDirections: true,
  showMap: true,
  showMoreInfo: true
};

export const DEFAULT_TRIP_LAYOUT_VISIBILITY: TripLayoutVisibility = {
  tripFinances: true,
  bookings: true,
  itineraryLinks: { ...DEFAULT_ITINERARY_LINKS_CONFIG }
};

export const DEFAULT_TRIP_LAYOUT_SEQUENCE: TripSummaryBlockId[] = [
  "tripFinances",
  "regenerate",
  "notes",
  "bookings",
  "vendorQuotes"
];

export function normalizeTripLayoutVisibility(input: unknown): TripLayoutVisibility {
  const src = (input && typeof input === "object" ? input : {}) as any;
  return {
    tripFinances: src.tripFinances !== false,
    bookings: src.bookings !== false,
    itineraryLinks: {
      showDirections:
        src.itineraryLinks && typeof src.itineraryLinks === "object"
          ? (src.itineraryLinks as any).showDirections !== false
          : DEFAULT_ITINERARY_LINKS_CONFIG.showDirections,
      showMap:
        src.itineraryLinks && typeof src.itineraryLinks === "object"
          ? (src.itineraryLinks as any).showMap !== false
          : DEFAULT_ITINERARY_LINKS_CONFIG.showMap,
      showMoreInfo:
        src.itineraryLinks && typeof src.itineraryLinks === "object"
          ? (src.itineraryLinks as any).showMoreInfo !== false
          : DEFAULT_ITINERARY_LINKS_CONFIG.showMoreInfo
    }
  };
}

export function normalizeTripLayoutSequence(
  sequence: unknown
): TripSummaryBlockId[] {
  const input = Array.isArray(sequence) ? sequence : [];
  const seen = new Set<TripSummaryBlockId>();
  const result: TripSummaryBlockId[] = [];

  for (const raw of input) {
    if (typeof raw !== "string") continue;
    if (!ALL_TRIP_SUMMARY_BLOCK_IDS.includes(raw as TripSummaryBlockId)) continue;
    const id = raw as TripSummaryBlockId;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }

  for (const id of ALL_TRIP_SUMMARY_BLOCK_IDS) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }

  return result;
}

export function normalizeTripLayoutConfig(raw: unknown): TripLayoutConfig {
  const src = (raw && typeof raw === "object" ? raw : {}) as any;
  const versionRaw = src.version;
  const version =
    typeof versionRaw === "number" && Number.isInteger(versionRaw) && versionRaw > 0
      ? versionRaw
      : 1;

  const visibility = normalizeTripLayoutVisibility(src.visibility);
  const sequence = normalizeTripLayoutSequence(src.sequence);

  return {
    version,
    visibility,
    sequence
  };
}

export type TripLayoutUpdate = {
  visibility?: TripLayoutVisibilityUpdate;
  sequence?: TripSummaryBlockId[];
  resetToDefault?: boolean;
};

export function applyTripLayoutUpdate(
  existing: TripLayoutConfig | null | undefined,
  update: TripLayoutUpdate
): TripLayoutConfig {
  if (update.resetToDefault) {
    const baseVersion = existing?.version ?? 0;
    return {
      version: baseVersion + 1,
      visibility: { ...DEFAULT_TRIP_LAYOUT_VISIBILITY },
      sequence: [...DEFAULT_TRIP_LAYOUT_SEQUENCE]
    };
  }

  const base: TripLayoutConfig = existing
    ? existing
    : {
        version: 0,
        visibility: { ...DEFAULT_TRIP_LAYOUT_VISIBILITY },
        sequence: [...DEFAULT_TRIP_LAYOUT_SEQUENCE]
      };

  const mergedVisibility: TripLayoutVisibility = {
    ...base.visibility,
    ...(update.visibility ?? {}),
    itineraryLinks: {
      ...base.visibility.itineraryLinks,
      ...(update.visibility?.itineraryLinks ?? {})
    }
  };

  const nextSequence = normalizeTripLayoutSequence(
    update.sequence && update.sequence.length > 0
      ? update.sequence
      : base.sequence
  );

  for (const id of REQUIRED_TRIP_SUMMARY_BLOCK_IDS) {
    if (!nextSequence.includes(id)) {
      nextSequence.push(id);
    }
  }

  return {
    version: base.version + 1,
    visibility: mergedVisibility,
    sequence: nextSequence
  };
}

export function hasTripLayoutVersionConflict(
  existingVersion: number | null | undefined,
  clientVersion: number | null | undefined
): boolean {
  if (!existingVersion || !clientVersion) return false;
  if (!Number.isInteger(existingVersion) || !Number.isInteger(clientVersion)) return false;
  return clientVersion !== existingVersion;
}

