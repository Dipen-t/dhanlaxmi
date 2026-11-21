import assert from "node:assert/strict";
import { test } from "node:test";
import { menuNotificationChanged, planCustomerNotifications, planVendorChanges, selectedMenuTemplateParams, selectedMenuText, vendorTemplateParams, type NotificationOrder } from "./notification-plan";

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

test("edited menus send customer_menu with exactly six variables to customer and Sunny", () => {
  const next = { ...before, customerName: "Mohit Raheja", date: "2026-11-20", venue: "Sky", extraPlates: 5,
    menuDishes: [{ dishId: 10, name: "Pineapple", categoryId: 3, categoryName: "Welcome Drinks" }, { dishId: 11, name: "Fruit Punch", categoryId: 3, categoryName: "Welcome Drinks" }, { dishId: 12, name: "Dal Tadka", categoryId: 4, categoryName: "Dal / Curry" }] };
  const expected = ["Mohit Raheja", "20/11/2026", "Sky", "dinner", "105", "Welcome Drinks: Pineapple / Fruit Punch | Dal / Curry: Dal Tadka"];
  assert.deepEqual(selectedMenuTemplateParams(next), expected);
  const messages = planCustomerNotifications(before, next);
  assert.deepEqual(messages.map(message => message.phone), [before.customerPhone, "8080200800"]);
  assert.equal(messages[1].recipientName, "Manager Sunny");
  for (const message of messages) {
    assert.equal(message.kind, "menu_update");
    assert.deepEqual(message.payload, { mode: "template", template: "customer_menu", params: expected });
    assert.ok(!message.payload.params.some(value => value.includes("\n")));
  }
});

test("confirmation remains customer-only and unchanged or empty edited menus do not queue menu templates", () => {
  const created = planCustomerNotifications(null, before);
  assert.equal(created[0].payload.template, "customerorder");
  assert.equal(created[1].payload.template, "customer_menu");
  assert.equal(created[1].recipientKind, "manager");
  assert.deepEqual(planCustomerNotifications(before, before), []);
  assert.deepEqual(planCustomerNotifications(before, { ...before, menuDishes: [] }), []);
  const empty = planCustomerNotifications(null, { ...before, menuDishes: [] });
  assert.equal(empty.length, 1);
  assert.equal(empty[0].payload.template, "customerorder");
});

test("menu notifications avoid duplicating Sunny and still notify him when customer phone is missing", () => {
  for (const customerPhone of [null, "+91 80802 00800"]) {
    const messages = planCustomerNotifications(before, { ...before, venue: "Updated venue", customerPhone });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].recipientKind, "manager");
    assert.equal(messages[0].payload.params[0], before.customerName);
  }
});
