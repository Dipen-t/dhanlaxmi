import assert from "node:assert/strict";
import { test } from "node:test";
import { sendOrderCustomerConfirmation } from "./customer-confirmation";
import type { sendBookingConfirmation } from "../whatsapp";

const order = { customerPhone: "+91 98765 43210", customerName: "Sahil", date: "2026-12-18", venue: "Okk", mealType: "dinner" };

test("order button uses the saved customer number and customer confirmation fields only", async () => {
  const requests: Parameters<typeof sendBookingConfirmation>[0][] = [];
  const result = await sendOrderCustomerConfirmation(1, async id => { assert.equal(id, "1"); return order; }, async request => { requests.push(request); return { success: true }; });
  assert.deepEqual(result, { success: true });
  assert.deepEqual(requests, [{ phone: "9876543210", customerName: "Sahil", eventDate: "18/12/2026", eventVenue: "Okk", meal: "dinner", menuDishes: "", fallbackMessage: "" }]);
});

test("missing or invalid customer phone prevents any message send", async () => {
  let sends = 0;
  for (const customerPhone of [null, "", "123", "not a phone"]) {
    const result = await sendOrderCustomerConfirmation(1, async () => ({ ...order, customerPhone }), async () => { sends++; return { success: true }; });
    assert.ok("error" in result && result.error.includes("customer phone"));
  }
  assert.equal(sends, 0);
});

test("invalid or missing orders do not send and provider errors are returned without fallback", async () => {
  let loads = 0;
  let sends = 0;
  const load = async () => { loads++; return null; };
  const send: typeof sendBookingConfirmation = async () => { sends++; return { error: "Template rejected" }; };
  assert.deepEqual(await sendOrderCustomerConfirmation(0, load, send), { error: "Invalid order." });
  assert.equal(loads, 0);
  assert.deepEqual(await sendOrderCustomerConfirmation(1, load, send), { error: "Order not found." });
  assert.equal(sends, 0);
  assert.deepEqual(await sendOrderCustomerConfirmation(1, async () => order, send), { error: "Template rejected" });
  assert.equal(sends, 1);
});
