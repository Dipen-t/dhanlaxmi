import assert from "node:assert/strict";
import { test } from "node:test";
import { eventDateString, parseEventDate } from "./event-date";

test("order dates survive save/reopen across server timezones and month/year boundaries", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "Asia/Kolkata", "America/Los_Angeles"]) {
      process.env.TZ = zone;
      for (const day of ["2026-11-30", "2026-12-01", "2027-01-01", "2028-02-29"]) {
        assert.equal(eventDateString(parseEventDate(day)), day, zone);
        assert.equal(parseEventDate(day).toISOString(), `${day}T00:00:00.000Z`);
      }
      assert.equal(eventDateString(new Date("2026-11-29T18:30:00Z")), "2026-11-30", "legacy IST midnight");
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
