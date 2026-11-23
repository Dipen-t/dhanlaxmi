import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateCashPosition } from "./cash-position";

test("received 50k minus 5k other expense and 5k vendor payment leaves 40k", () => {
  assert.deepEqual(
    calculateCashPosition(
      [{ amount: 50_000, isWaived: false }],
      [{ amount: 5_000 }],
      [{ amount: 5_000 }],
    ),
    {
      clientPaid: 50_000,
      clientWaived: 0,
      otherExpenses: 5_000,
      vendorExpenses: 5_000,
      totalExpenses: 10_000,
      netProfit: 40_000,
    },
  );
});

test("waived balances do not count as cash; spend comes from total received", () => {
  const result = calculateCashPosition(
    [
      { amount: 30_000, isWaived: false },
      { amount: 20_000, isWaived: false },
      { amount: 10_000, isWaived: true },
    ],
    [{ amount: 3_000 }, { amount: 2_000 }],
    [{ amount: 2_000 }, { amount: 3_000 }],
  );
  assert.equal(result.clientPaid, 50_000);
  assert.equal(result.clientWaived, 10_000);
  assert.equal(result.otherExpenses, 5_000);
  assert.equal(result.vendorExpenses, 5_000);
  assert.equal(result.netProfit, 40_000);
});

test("cash loss stays negative; no payments means zero cash", () => {
  assert.equal(
    calculateCashPosition(
      [{ amount: 1_000, isWaived: false }],
      [{ amount: 1_000 }],
      [{ amount: 500 }],
    ).netProfit,
    -500,
  );
  assert.equal(calculateCashPosition([], []).netProfit, 0);
});
