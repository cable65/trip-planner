import test from "node:test";
import assert from "node:assert/strict";
import { buildExternalLinksForActivity } from "../src/app/trips/[id]/activity-card";
import type { ItineraryLinksConfig } from "../src/lib/trip-layout";

const ALL_ON: ItineraryLinksConfig = {
  showDirections: true,
  showMap: true,
  showMoreInfo: true
};

test("activity external links include officialUrl when provided", () => {
  const links = buildExternalLinksForActivity(
    {
      name: "Museum",
      officialUrl: "https://example.com/museum"
    },
    ALL_ON
  );

  const official = links.find((l) => l.label === "Official Site");
  assert.ok(official);
  assert.equal(official?.url, "https://example.com/museum");
});

test("itinerary link settings hide map and more info when disabled", () => {
  const config: ItineraryLinksConfig = {
    showDirections: false,
    showMap: false,
    showMoreInfo: false
  };

  const links = buildExternalLinksForActivity(
    {
      name: "Central Park",
      location: "Central Park, New York"
    },
    config
  );

  const hasMap = links.some((l) => l.label === "View on Map" || l.label === "Directions");
  const hasMoreInfo = links.some((l) => l.label === "More Info");

  assert.equal(hasMap, false);
  assert.equal(hasMoreInfo, false);
});

