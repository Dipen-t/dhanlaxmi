import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateCashPosition } from "./cash-position";

test("received 50k minus 5k other expense and 5k vendor payment leaves 40k", () => {
  assert.deepEqual(calculateCashPosition([{ amount: 50_000, isWaived: false, expenses: [{ amount: 5_000 }] }], [{ amount: 5_000 }]), {
    clientPaid: 50_000, clientWaived: 0, otherExpenses: 5_000, vendorExpenses: 5_000, totalExpenses: 10_000, netProfit: 40_000,
  });
});
test("waived balances do not count as cash and multiple payments/expenses count once", () => {
  const result = calculateCashPosition([
    { amount: 30_000, isWaived: false, expenses: [{ amount: 2_000 }, { amount: 3_000 }] },
    { amount: 20_000, isWaived: false, expenses: [] },
    { amount: 10_000, isWaived: true, expenses: [] },
  ], [{ amount: 3_000 }, { amount: 2_000 }]);
  assert.equal(result.netProfit, 40_000);
  assert.equal(result.clientWaived, 10_000);
});
test("cash loss stays negative; no payments means zero cash", () => {
  assert.equal(calculateCashPosition([{ amount: 1_000, isWaived: false, expenses: [{ amount: 500 }] }], [{ amount: 1_000 }]).netProfit, -500);
  assert.equal(calculateCashPosition([], []).netProfit, 0);
});
