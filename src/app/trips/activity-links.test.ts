import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildExternalLinksForActivity } from "./[id]/activity-card";

describe("buildExternalLinksForActivity", () => {
  it("includes a directions link when coordinates are present", () => {
    const links = buildExternalLinksForActivity({
      name: "Sample Place",
      coordinates: { lat: 3.1415, lng: 101.6869 }
    } as any);

    const directions = links.find((l) => l.label === "Directions");
    assert.ok(directions);
    assert.ok(directions!.url.includes("https://www.google.com/maps"));
  });

  it("includes a map link when only location text is present", () => {
    const links = buildExternalLinksForActivity({
      name: "Sample Place",
      location: "Kuala Lumpur"
    } as any);

    const mapLink = links.find((l) => l.label === "View on Map");
    assert.ok(mapLink);
    assert.ok(mapLink!.url.includes("https://www.google.com/maps"));
  });

  it("always includes a more info search link when there is a location or name", () => {
    const links = buildExternalLinksForActivity({
      name: "Petronas Twin Towers"
    } as any);

    const moreInfo = links.find((l) => l.label === "More Info");
    assert.ok(moreInfo);
    assert.ok(moreInfo!.url.includes("https://www.google.com/search"));
  });
});

