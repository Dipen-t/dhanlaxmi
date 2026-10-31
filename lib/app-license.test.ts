import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { daysRemaining, isPastExpiry, normalizeExpiresOn } from "./app-license-dates";

describe("app license dates", () => {
  it("treats null as unlimited", () => {
    assert.equal(isPastExpiry(null, "2026-10-31"), false);
    assert.equal(daysRemaining(null, "2026-10-31"), null);
  });

  it("allows access on the expiry day", () => {
    assert.equal(isPastExpiry("2026-10-31", "2026-10-31"), false);
    assert.equal(daysRemaining("2026-10-31", "2026-10-31"), 0);
  });

  it("locks the day after expiry", () => {
    assert.equal(isPastExpiry("2026-10-30", "2026-10-31"), true);
    assert.equal(daysRemaining("2026-10-30", "2026-10-31"), -1);
  });

  it("counts remaining days", () => {
    assert.equal(daysRemaining("2026-11-02", "2026-10-31"), 2);
  });

  it("normalizes blank to null", () => {
    assert.equal(normalizeExpiresOn(""), null);
    assert.equal(normalizeExpiresOn("  "), null);
    assert.equal(normalizeExpiresOn("2026-12-01"), "2026-12-01");
  });

  it("rejects invalid dates", () => {
    assert.throws(() => normalizeExpiresOn("31-10-2026"));
  });
});
