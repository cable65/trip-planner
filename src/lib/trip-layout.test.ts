import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_TRIP_SUMMARY_BLOCK_IDS,
  DEFAULT_TRIP_LAYOUT_SEQUENCE,
  DEFAULT_TRIP_LAYOUT_VISIBILITY,
  applyTripLayoutUpdate,
  hasTripLayoutVersionConflict,
  normalizeTripLayoutConfig,
  normalizeTripLayoutSequence,
  normalizeTripLayoutVisibility
} from "./trip-layout";

describe("trip layout visibility normalization", () => {
  it("applies defaults when input is null", () => {
    const vis = normalizeTripLayoutVisibility(null as any);
    assert.deepEqual(vis, DEFAULT_TRIP_LAYOUT_VISIBILITY);
  });

  it("treats missing flags as true and false explicitly", () => {
    const vis = normalizeTripLayoutVisibility({ tripFinances: false } as any);
    assert.equal(vis.tripFinances, false);
    assert.equal(vis.bookings, true);
  });
});

describe("trip layout sequence normalization", () => {
  it("falls back to the default sequence when input is empty", () => {
    const seq = normalizeTripLayoutSequence([]);
    assert.deepEqual(seq, DEFAULT_TRIP_LAYOUT_SEQUENCE);
  });

  it("filters invalid ids and removes duplicates", () => {
    const seq = normalizeTripLayoutSequence([
      "tripFinances",
      "tripFinances",
      "unknown",
      "bookings"
    ] as any);

    assert.ok(seq.includes("tripFinances"));
    assert.ok(seq.includes("bookings"));
    assert.equal(seq.filter((x) => x === "tripFinances").length, 1);
    for (const id of seq) {
      assert.ok(ALL_TRIP_SUMMARY_BLOCK_IDS.includes(id));
    }
  });

  it("ensures all known ids are present at least once", () => {
    const seq = normalizeTripLayoutSequence(["tripFinances"]);
    for (const id of ALL_TRIP_SUMMARY_BLOCK_IDS) {
      assert.ok(seq.includes(id));
    }
  });
});

describe("trip layout config normalization", () => {
  it("builds a full config from null", () => {
    const cfg = normalizeTripLayoutConfig(null as any);
    assert.equal(cfg.version, 1);
    assert.deepEqual(cfg.visibility, DEFAULT_TRIP_LAYOUT_VISIBILITY);
    assert.deepEqual(cfg.sequence, DEFAULT_TRIP_LAYOUT_SEQUENCE);
  });

  it("respects stored version when valid", () => {
    const cfg = normalizeTripLayoutConfig({ version: 5 });
    assert.equal(cfg.version, 5);
  });
});

describe("trip layout updates", () => {
  it("increments version and merges visibility", () => {
    const existing = normalizeTripLayoutConfig({ version: 2 });
    const next = applyTripLayoutUpdate(existing, {
      visibility: { tripFinances: false }
    });

    assert.equal(next.version, 3);
    assert.equal(next.visibility.tripFinances, false);
    assert.equal(next.visibility.bookings, true);
  });

  it("resets to defaults when requested", () => {
    const existing = normalizeTripLayoutConfig({
      version: 1,
      visibility: { tripFinances: false, bookings: false }
    });

    const next = applyTripLayoutUpdate(existing, { resetToDefault: true });
    assert.equal(next.version, 2);
    assert.deepEqual(next.visibility, DEFAULT_TRIP_LAYOUT_VISIBILITY);
    assert.deepEqual(next.sequence, DEFAULT_TRIP_LAYOUT_SEQUENCE);
  });

  it("keeps all required blocks in the sequence", () => {
    const existing = normalizeTripLayoutConfig({ version: 1 });
    const next = applyTripLayoutUpdate(existing, {
      sequence: ["regenerate", "notes"]
    });

    assert.ok(next.sequence.includes("tripFinances"));
    assert.ok(next.sequence.includes("bookings"));
  });
});

describe("trip layout version conflict detection", () => {
  it("does not conflict when either version is missing", () => {
    assert.equal(hasTripLayoutVersionConflict(null, 1), false);
    assert.equal(hasTripLayoutVersionConflict(1, null), false);
  });

  it("detects mismatched versions", () => {
    assert.equal(hasTripLayoutVersionConflict(2, 1), true);
    assert.equal(hasTripLayoutVersionConflict(1, 2), true);
  });

  it("accepts matching versions", () => {
    assert.equal(hasTripLayoutVersionConflict(3, 3), false);
  });
});

