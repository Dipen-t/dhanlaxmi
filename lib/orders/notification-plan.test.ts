import assert from "node:assert/strict";
import { test } from "node:test";
import { menuNotificationChanged, planCustomerNotifications, planVendorChanges, selectedMenuTemplateParams, selectedMenuText, vendorTemplateParams, type NotificationOrder } from "./notification-plan";

const before: NotificationOrder = { id: 1, date: "2026-12-18", venue: "Test venue", mealType: "dinner", numberOfPersons: 100, extraPlates: 0, customerName: "Test customer", customerPhone: "9999999999", rawMaterials: [{ rawMaterialId: 1, vendorId: 10, timing: "18:00", unitQty: "100", unitName: "plates", notes: "Serve warm" }, { rawMaterialId: 2, vendorId: 20, timing: "19:00", unitQty: "20", unitName: "kg" }], menuDishes: [{ dishId: 3, name: "Soup", categoryId: 1, categoryName: "Soups" }] };

test("all assigned vendors receive their list when order is edited; identical saves do nothing", () => {
  assert.deepEqual(planVendorChanges(before, before), { updates: [], removed: [] });
  assert.equal(planVendorChanges(before, { ...before, rawMaterials: [...before.rawMaterials].reverse() }).updates.length, 0);
  const edited = { ...before, rawMaterials: before.rawMaterials.map(item => item.vendorId === 10 ? { ...item, unitQty: "120" } : item) };
  assert.deepEqual(planVendorChanges(before, edited).updates.map(group => group.vendorId), [10, 20]);
  assert.equal(menuNotificationChanged(before, edited), false);
});

test("removed/replaced vendor assignments are flagged for manual contact and remaining vendors receive updates", () => {
  const next = { ...before, rawMaterials: before.rawMaterials.map(item => item.vendorId === 10 ? { ...item, vendorId: 30 } : item) };
  assert.deepEqual(planVendorChanges(before, next).removed.map(group => group.vendorId), [10]);
  assert.deepEqual(planVendorChanges(before, next).updates.map(group => group.vendorId), [30, 20]);
});

test("schedule and plate-count changes notify all vendors without scaling quantities", () => {
  for (const next of [{ ...before, date: "2026-12-19" }, { ...before, venue: "New venue" }, { ...before, extraPlates: 10 }]) assert.deepEqual(planVendorChanges(before, next).updates.map(group => group.vendorId), [10, 20]);
  assert.equal(before.rawMaterials[0].unitQty, "100");
});

test("materials stay numbered without plate count; update banner moves to notes param", () => {
  const params = vendorTemplateParams(before, "dinner", before.rawMaterials, new Map([[1, "Paneer"], [2, "Rice"]]), before.venue, true);
  assert.equal(params[0], "18/12/2026 at dinner");
  assert.equal(params[2], "1) Paneer: 100 plates @ 6:00 PM (Serve warm) · 2) Rice: 20 kg @ 7:00 PM");
  assert.equal(params[3], "UPDATED ORDER — replaces previous details");
  assert.ok(!params[2].includes("UPDATED"));
  assert.ok(!params[2].includes("Plates:"));
  assert.ok(!params[3].includes("Paneer") && !params[3].includes("Customer"));
});

test("fresh orders append item description in parentheses after qty/unit", () => {
  const params = vendorTemplateParams(before, "dinner", [before.rawMaterials[0]], new Map([[1, "Paneer"]]), before.venue, false);
  assert.equal(params[2], "1) Paneer: 100 plates @ 6:00 PM (Serve warm)");
  assert.equal(params[3], "—");
  assert.ok(!params[2].includes("Plates:"));
});

test("vendor message keeps descriptions on the item line and omits empty ones", () => {
  const itemsWithDescription = [
    { rawMaterialId: 1, unitQty: "50", unitName: "pcs", notes: "cut thin" },
    { rawMaterialId: 2, unitQty: "10", unitName: "liters", notes: "  " },
  ];
  const params = vendorTemplateParams(before, "dinner", itemsWithDescription, new Map([[1, "Samosa"], [2, "Milk"]]), before.venue, false);
  assert.equal(params[2], "1) Samosa: 50 pcs (cut thin) · 2) Milk: 10 liters");
  assert.equal(params[3], "—");
});

test("same vendor with different item timings still produces one combined materials line", () => {
  const sameVendor = [
    { rawMaterialId: 1, vendorId: 10, timing: "10:30", unitQty: "5", unitName: "kg", notes: null },
    { rawMaterialId: 2, vendorId: 10, timing: "19:00", unitQty: "2", unitName: "boxes", notes: "fresh" },
  ];
  const groups = planVendorChanges(null, { ...before, rawMaterials: sameVendor }).updates;
  assert.equal(groups.length, 1);
  assert.equal(groups[0].vendorId, 10);
  assert.equal(groups[0].items.length, 2);
  const params = vendorTemplateParams(before, groups[0].timing, groups[0].items, new Map([[1, "Onion"], [2, "Tomato"]]), before.venue, false);
  assert.equal(params[2], "1) Onion: 5 kg @ 10:30 AM · 2) Tomato: 2 boxes @ 7:00 PM (fresh)");
});

test("changed selected dishes trigger customer/manager menu text without a booking confirmation or time", () => {
  const next = { ...before, menuDishes: [...before.menuDishes, { dishId: 4, name: "Paneer", categoryId: 2, categoryName: "Starters" }] };
  assert.equal(menuNotificationChanged(before, before), false);
  assert.equal(menuNotificationChanged(before, next), true);
  const text = selectedMenuText(next);
  assert.ok(text.includes("Test customer") && text.includes("Paneer"));
  assert.ok(!text.includes("confirmed") && !text.includes("18:00") && !text.includes("6:00"));
});

test("edited menus send customer_menu_pdf with exactly five variables to customer and Sunny", () => {
  const next = { ...before, customerName: "Mohit Raheja", date: "2026-11-20", venue: "Sky", extraPlates: 5,
    menuDishes: [{ dishId: 10, name: "Pineapple", categoryId: 3, categoryName: "Welcome Drinks" }, { dishId: 11, name: "Fruit Punch", categoryId: 3, categoryName: "Welcome Drinks" }, { dishId: 12, name: "Dal Tadka", categoryId: 4, categoryName: "Dal / Curry" }] };
  const expected = ["Mohit Raheja", "20/11/2026", "Sky", "dinner", "105"];
  assert.deepEqual(selectedMenuTemplateParams(next), expected);
  const messages = planCustomerNotifications(before, next);
  assert.deepEqual(messages.map(message => message.phone), [before.customerPhone, "8080200800"]);
  assert.equal(messages[1].recipientName, "Manager Sunny");
  for (const message of messages) {
    assert.equal(message.kind, "menu_update");
    assert.deepEqual(message.payload, { mode: "template", template: "customer_menu_pdf", params: expected });
    assert.ok(!message.payload.params.some(value => value.includes("\n")));
  }
});

test("confirmation remains customer-only and unchanged or empty edited menus do not queue menu templates", () => {
  const created = planCustomerNotifications(null, before);
  assert.equal(created[0].payload.template, "customerorder");
  assert.equal(created[1].payload.template, "customer_menu_pdf");
  assert.equal(created[1].recipientKind, "manager");
  assert.deepEqual(planCustomerNotifications(before, before), []);
  assert.deepEqual(planCustomerNotifications(before, { ...before, menuDishes: [] }), []);
  const empty = planCustomerNotifications(null, { ...before, menuDishes: [] });
  assert.equal(empty.length, 1);
  assert.equal(empty[0].payload.template, "customerorder");
});

test("menu text keeps regular dishes without category heading, only Hi-tea category has a heading", () => {
  const mixed: NotificationOrder = {
    ...before,
    menuDishes: [
      { dishId: 1, name: "Paneer Tikka", categoryId: 1, categoryName: "Starters" },
      { dishId: 2, name: "Dal Makhani", categoryId: 2, categoryName: "Dal / Curry" },
      { dishId: 3, name: "Assorted Uttapam", categoryId: 42, categoryName: "Hi-tea" },
      { dishId: 4, name: "Special Tea", categoryId: 42, categoryName: "Hi-tea" },
    ],
  };
  const text = selectedMenuText(mixed);
  assert.ok(text.includes("• Paneer Tikka\n• Dal Makhani\n\nHi-tea\n• Assorted Uttapam\n• Special Tea"));
  assert.ok(!text.includes("Starters"));
  assert.ok(!text.includes("Dal / Curry"));
});

test("menu notifications avoid duplicating Sunny and still notify him when customer phone is missing", () => {
  for (const customerPhone of [null, "+91 80802 00800"]) {
    const messages = planCustomerNotifications(before, { ...before, venue: "Updated venue", customerPhone });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].recipientKind, "manager");
    assert.equal(messages[0].payload.params[0], before.customerName);
  }
});

test("notifies both Customer 1 and Customer 2 when both numbers are present without duplicating identical phones", () => {
  const orderWithTwo: NotificationOrder = {
    ...before,
    customerName: "Rahul",
    customerPhone: "9876543210",
    customer2Name: "Priya",
    customer2Phone: "9123456789",
  };

  // Creation: both customers receive customerorder template
  const created = planCustomerNotifications(null, orderWithTwo);
  assert.equal(created.length, 3); // Customer 1, Customer 2, Manager Sunny (has menu)
  assert.equal(created[0].recipientKind, "customer");
  assert.equal(created[0].phone, "9876543210");
  assert.equal(created[0].recipientName, "Rahul");
  assert.equal(created[0].payload.template, "customerorder");

  assert.equal(created[1].recipientKind, "customer");
  assert.equal(created[1].phone, "9123456789");
  assert.equal(created[1].recipientName, "Priya");
  assert.equal(created[1].payload.template, "customerorder");

  assert.equal(created[2].recipientKind, "manager");

  // Edit with menu update: both receive customer_menu_pdf personalized with their respective names
  const edited = { ...orderWithTwo, venue: "Grand Ballroom" };
  assert.equal(menuNotificationChanged(orderWithTwo, edited), true);
  const updated = planCustomerNotifications(orderWithTwo, edited);
  assert.equal(updated.length, 3);
  assert.equal(updated[0].phone, "9876543210");
  assert.equal(updated[0].payload.params[0], "Rahul");
  assert.equal(updated[1].phone, "9123456789");
  assert.equal(updated[1].payload.params[0], "Priya");
  assert.equal(updated[2].phone, "8080200800");

  // Duplicate phone: if customer2Phone is identical to customerPhone, do not duplicate
  const duplicatePhoneOrder: NotificationOrder = {
    ...orderWithTwo,
    customer2Phone: "9876543210",
  };
  const dupMessages = planCustomerNotifications(null, duplicatePhoneOrder);
  assert.equal(dupMessages.filter(m => m.recipientKind === "customer").length, 1);

  // If customer2Phone is Sunny's number, do not send customer message to Sunny
  const sunnyCustomer2Order: NotificationOrder = {
    ...orderWithTwo,
    customer2Phone: "8080200800",
  };
  const sunnyCustomer2Messages = planCustomerNotifications(null, sunnyCustomer2Order);
  assert.equal(sunnyCustomer2Messages.filter(m => m.recipientKind === "customer").length, 1);
});

test("changing customer 2 name or phone triggers menuNotificationChanged", () => {
  const base: NotificationOrder = { ...before, customer2Name: "Priya", customer2Phone: "9123456789" };
  assert.equal(menuNotificationChanged(base, { ...base, customer2Phone: "9988776655" }), true);
  assert.equal(menuNotificationChanged(base, { ...base, customer2Name: "Anjali" }), true);
  assert.equal(menuNotificationChanged(base, base), false);
});
