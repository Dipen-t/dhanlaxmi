import assert from "node:assert/strict";
import { test } from "node:test";
import { isHiTeaCategory, normalizeHiTeaNotes } from "./hi-tea";
import { menuNotificationChanged, planCustomerNotifications, planVendorChanges, selectedMenuTemplateParams, type NotificationOrder } from "./notification-plan";

const order: NotificationOrder = {
  id: 1, date: "2026-11-30", venue: "Test", mealType: "dinner", numberOfPersons: 100, extraPlates: 0,
  customerName: "Test customer", customerPhone: "9999999999", rawMaterials: [], menuDishes: [],
};

test("Hi-tea notes support familiar category spellings and optional blank notes", () => {
  for (const name of ["Hi Tea", "Hi-tea", "High Tea", "Hightea", "Hi Tea Starters"]) assert(isHiTeaCategory(name));
  assert(!isHiTeaCategory("Extras"));
  assert.equal(normalizeHiTeaNotes(null), "");
  assert.equal(normalizeHiTeaNotes("  Serve tea\nNo sugar  "), "Serve tea\nNo sugar");
});

test("notes-only menu changes reach customer and manager without notifying vendors", () => {
  const next = { ...order, hiTeaNotes: "Serve tea at 5 PM\nPack snacks separately" };
  assert(menuNotificationChanged(order, next));
  const messages = planCustomerNotifications(order, next);
  assert.deepEqual(messages.map(message => message.recipientKind), ["customer", "manager"]);
  assert(messages.every(message => message.payload.template === "customer_menu_pdf"));
  assert.deepEqual(selectedMenuTemplateParams(next), ["Test customer", "30/11/2026", "Test", "dinner", "100"]);
  assert.deepEqual(planVendorChanges(order, next), { updates: [], removed: [] });
  assert(!menuNotificationChanged(next, { ...next, hiTeaNotes: `  ${next.hiTeaNotes}  ` }));
});

test("clearing notes on an existing dish menu is included in the next menu update", () => {
  const selected = { ...order, menuDishes: [{ dishId: 1, name: "Tea", categoryId: 3, categoryName: "Hi Tea" }], hiTeaNotes: "No sugar" };
  const cleared = { ...selected, hiTeaNotes: "" };
  assert.deepEqual(selectedMenuTemplateParams(selected), ["Test customer", "30/11/2026", "Test", "dinner", "100"]);
  assert.deepEqual(selectedMenuTemplateParams(cleared), ["Test customer", "30/11/2026", "Test", "dinner", "100"]);
  assert.equal(planCustomerNotifications(selected, cleared).length, 2);
});
