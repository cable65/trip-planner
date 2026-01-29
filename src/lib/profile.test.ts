import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeProfileCompletion, normalizeProfilePrivacy } from "./profile";

describe("computeProfileCompletion", () => {
  it("returns 0 when all fields are empty", () => {
    const percent = computeProfileCompletion({});
    assert.equal(percent, 0);
  });

  it("returns 100 when all fields are filled", () => {
    const percent = computeProfileCompletion({
      name: "Alice",
      phone: "+60123456789",
      jobTitle: "Agent",
      company: "Trip Co",
      location: "Kuala Lumpur, MY",
      website: "https://example.com",
      bio: "Traveler",
      avatarUrl: "https://cdn/avatar.png",
      coverUrl: "https://cdn/cover.png"
    });
    assert.equal(percent, 100);
  });

  it("is proportional to the number of filled fields", () => {
    const percent = computeProfileCompletion({
      name: "Alice",
      phone: "+60123456789"
    });
    assert.ok(percent > 0 && percent < 100);
  });
});

describe("normalizeProfilePrivacy", () => {
  it("fills defaults when input is null", () => {
    const privacy = normalizeProfilePrivacy(null as any);
    assert.equal(privacy.phone, "private");
    assert.equal(privacy.website, "public");
  });

  it("overrides defaults with provided values", () => {
    const privacy = normalizeProfilePrivacy({ phone: "public", bio: "private" });
    assert.equal(privacy.phone, "public");
    assert.equal(privacy.bio, "private");
  });
});

