import assert from "node:assert/strict";
import { test } from "node:test";
import { menuNotificationChanged, planVendorChanges, selectedMenuText, vendorTemplateParams, type NotificationOrder } from "./notification-plan";

const before: NotificationOrder = { id: 1, date: "2026-12-18", venue: "Test venue", mealType: "dinner", numberOfPersons: 100, extraPlates: 0, customerName: "Test customer", customerPhone: "9999999999", rawMaterials: [{ rawMaterialId: 1, vendorId: 10, timing: "18:00", unitQty: "100", unitName: "plates", notes: "Serve warm" }, { rawMaterialId: 2, vendorId: 20, timing: "19:00", unitQty: "20", unitName: "kg" }], menuDishes: [{ dishId: 3, name: "Soup", categoryId: 1, categoryName: "Soups" }] };

test("only changed vendors are notified; rearranging materials or identical saves do nothing", () => {
  assert.deepEqual(planVendorChanges(before, before), { updates: [], removed: [] });
  assert.equal(planVendorChanges(before, { ...before, rawMaterials: [...before.rawMaterials].reverse() }).updates.length, 0);
  const edited = { ...before, rawMaterials: before.rawMaterials.map(item => item.vendorId === 10 ? { ...item, unitQty: "120" } : item) };
  assert.deepEqual(planVendorChanges(before, edited).updates.map(group => group.vendorId), [10]);
  assert.equal(menuNotificationChanged(before, edited), false);
});

test("removed/replaced vendor assignments are flagged for manual contact", () => {
  const next = { ...before, rawMaterials: before.rawMaterials.map(item => item.vendorId === 10 ? { ...item, vendorId: 30 } : item) };
  assert.deepEqual(planVendorChanges(before, next).removed.map(group => group.vendorId), [10]);
  assert.deepEqual(planVendorChanges(before, next).updates.map(group => group.vendorId), [30]);
});

test("schedule and plate-count changes notify all vendors without scaling quantities", () => {
  for (const next of [{ ...before, date: "2026-12-19" }, { ...before, venue: "New venue" }, { ...before, extraPlates: 10 }]) assert.deepEqual(planVendorChanges(before, next).updates.map(group => group.vendorId), [10, 20]);
  assert.equal(before.rawMaterials[0].unitQty, "100");
});

test("materials stay numbered and plates-first; update banner moves to notes param", () => {
  const params = vendorTemplateParams(before, "18:00", before.rawMaterials, new Map([[1, "Paneer"], [2, "Rice"]]), before.venue, true);
  assert.equal(params[0], "18/12/2026 at 6:00 PM");
  assert.equal(params[2], "Plates: 100 · 1) Paneer: 100 plates · 2) Rice: 20 kg");
  assert.equal(params[3], "UPDATED ORDER — replaces previous details · Serve warm");
  assert.ok(!params[2].includes("UPDATED"));
  assert.ok(!params[3].includes("Paneer") && !params[3].includes("Customer"));
});

test("fresh orders keep notes clean without an update banner", () => {
  const params = vendorTemplateParams(before, "18:00", [before.rawMaterials[0]], new Map([[1, "Paneer"]]), before.venue, false);
  assert.equal(params[2], "Plates: 100 · 1) Paneer: 100 plates");
  assert.equal(params[3], "Serve warm");
});

test("changed selected dishes trigger customer/manager menu text without a booking confirmation or time", () => {
  const next = { ...before, menuDishes: [...before.menuDishes, { dishId: 4, name: "Paneer", categoryId: 2, categoryName: "Starters" }] };
  assert.equal(menuNotificationChanged(before, before), false);
  assert.equal(menuNotificationChanged(before, next), true);
  const text = selectedMenuText(next);
  assert.ok(text.includes("Test customer") && text.includes("Paneer"));
  assert.ok(!text.includes("confirmed") && !text.includes("18:00") && !text.includes("6:00"));
});
