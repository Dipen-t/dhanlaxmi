import assert from "node:assert/strict";
import { test } from "node:test";
import { groupMaterialsByVendorTiming, vendorScheduleLabel } from "./vendor-timing";

test("each vendor gets one combined group; item timings do not split messages", () => {
  const items = [
    { id: 1, vendorId: 1, timing: "10:30" },
    { id: 2, vendorId: 2, timing: "19:00" },
    { id: 3, vendorId: 1, timing: "10:30" },
    { id: 4, vendorId: 1, timing: "" },
    { id: 5, vendorId: null, timing: "12:00" },
  ];
  assert.deepEqual(groupMaterialsByVendorTiming(items, "lunch"), [
    { vendorId: 1, timing: "lunch", items: [items[0], items[2], items[3]] },
    { vendorId: 2, timing: "lunch", items: [items[1]] },
  ]);
  assert.equal(vendorScheduleLabel("2026-11-21", "10:30"), "21/11/2026 at 10:30 AM");
  assert.equal(vendorScheduleLabel("2026-11-21", "00:00"), "21/11/2026 at 12:00 AM");
  assert.equal(vendorScheduleLabel("2026-11-21", "12:00"), "21/11/2026 at 12:00 PM");
  for (const meal of ["lunch", "dinner", "breakfast"]) {
    const groups = groupMaterialsByVendorTiming([{ vendorId: 1 }], meal);
    assert.equal(vendorScheduleLabel("2026-11-21", groups[0].timing), `21/11/2026 at ${meal}`);
  }
});
