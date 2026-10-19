import assert from "node:assert/strict";
import test from "node:test";

import { calculatePlateTotal } from "./pricing.ts";

test("calculates the order amount from plates and the per-plate rate", () => {
  assert.equal(calculatePlateTotal(500, 800), 400_000);
});

test("rejects invalid and database-overflowing amounts", () => {
  assert.equal(calculatePlateTotal(0, 800), null);
  assert.equal(calculatePlateTotal(500, 0), null);
  assert.equal(calculatePlateTotal(100_000, 100_000), null);
});
