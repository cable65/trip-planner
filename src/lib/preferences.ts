export type ItineraryPreferences = {
  dayStartTime: string; // "09:00"
  defaultDurationMinutes: {
    [category: string]: number;
  };
  defaultBufferMinutes: number;
  travelTimeMethod: "fixed" | "estimated"; // "fixed" uses default buffer, "estimated" could use distance (future)
};

export const defaultPreferences: ItineraryPreferences = {
  dayStartTime: "09:00",
  defaultDurationMinutes: {
    food: 60,
    sightseeing: 90,
    culture: 120,
    relax: 60,
    default: 60
  },
  defaultBufferMinutes: 30,
  travelTimeMethod: "fixed"
};
