import assert from "node:assert/strict";
import { test } from "node:test";
import { buildVendorLedger, type VendorPayment } from "./vendor-ledger";
import { calculateCashPosition } from "../reports/cash-position";

const payment = (id: number, vendorId: number, amount: number): VendorPayment => ({
  id, vendorId, vendorName: `Vendor ${vendorId}`, amount, date: "2026-10-14", notes: null,
});

test("vendor totals and history include payments to vendors not linked by materials", () => {
  const result = buildVendorLedger([{ id: 1, name: "Vendor 1" }], [payment(1, 1, 3000), payment(2, 1, 2000), payment(3, 2, 4000)]);
  assert.equal(result[0].totalPaid, 5000);
  assert.equal(result[0].payments.length, 2);
  assert.equal(result[1].totalPaid, 4000);
});
test("linked unpaid vendors show zero without duplicate rows", () => {
  const result = buildVendorLedger([{ id: 1, name: "Vendor 1" }, { id: 1, name: "Vendor 1" }], []);
  assert.equal(result.length, 1);
  assert.equal(result[0].totalPaid, 0);
});
test("vendor payments remain visible without client receipts; cash summary counts both outflows once", () => {
  const payments = [payment(1, 1, 5000)];
  assert.equal(buildVendorLedger([], payments)[0].totalPaid, 5000);
  assert.equal(calculateCashPosition([], payments).netProfit, -5000);
  assert.equal(calculateCashPosition([{ amount: 50000, isWaived: false, expenses: [{ amount: 5000 }] }], payments).netProfit, 40000);
});
