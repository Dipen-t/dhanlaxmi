import assert from "node:assert/strict";
import { test } from "node:test";
import { sendBookingConfirmation } from "./whatsapp";

test("customerorder uses date, venue, meal and retains fallback only on rejection", async () => {
  const originalFetch = globalThis.fetch;
  const keys = ["WHATSAPP_DEBUG", "WHATSAPP_HUB_USER", "WHATSAPP_HUB_PASS", "WHATSAPP_BOOKING_TEMPLATE", "WHATSAPP_ORDER_TEMPLATE"];
  const previous = keys.map((key) => process.env[key]);
  const requests: URL[] = [];
  const options = { phone: "9999999999", customerName: "Test customer", eventDate: "30/11/2026 at 10:00 PM", eventVenue: "Test venue", meal: "dinner", menuDishes: "Paneer", fallbackMessage: "Your booking is confirmed." };
  try {
    process.env.WHATSAPP_DEBUG = "0";
    process.env.WHATSAPP_HUB_USER = "test";
    process.env.WHATSAPP_HUB_PASS = "test";
    process.env.WHATSAPP_ORDER_TEMPLATE = "order_alert_final";
    process.env.WHATSAPP_BOOKING_TEMPLATE = "order_pdf";
    globalThis.fetch = async (input) => {
      requests.push(new URL(String(input)));
      return new Response("Template rejected", { status: 400 });
    };
    assert.ok("error" in await sendBookingConfirmation(options));
    assert.equal(requests.length, 2);
    assert.equal(requests[0].searchParams.get("text"), "customerorder");
    assert.equal(requests[0].searchParams.get("Params"), [options.eventDate, options.eventVenue, options.meal].join(","));
    assert.equal(requests[1].searchParams.get("text"), "order_alert_final");
    assert.ok(requests[1].searchParams.get("Params")?.includes(options.eventVenue));

    process.env.WHATSAPP_BOOKING_TEMPLATE = "order_pdf";
    globalThis.fetch = async (input) => {
      requests.push(new URL(String(input)));
      return new Response("S. Message queued", { status: 200 });
    };
    assert.deepEqual(await sendBookingConfirmation(options), { success: true });
    assert.equal(requests.length, 3);
    assert.equal(requests[2].searchParams.get("text"), "customerorder", "successful customer send needs no fallback");
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});
