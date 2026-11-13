import assert from "node:assert/strict";
import { test } from "node:test";
import { sendBookingConfirmation, sendMenuPdfViaWhatsApp } from "./whatsapp";

test("customer and PDF sends use exact templates and return provider errors without vendor fallback", async () => {
  const originalFetch = globalThis.fetch;
  const keys = ["WHATSAPP_DEBUG", "WHATSAPP_HUB_USER", "WHATSAPP_HUB_PASS", "WHATSAPP_BOOKING_TEMPLATE", "WHATSAPP_ORDER_TEMPLATE", "WHATSAPP_HUB_URL"];
  const previous = keys.map((key) => process.env[key]);
  const requests: URL[] = [];
  const options = { phone: "9999999999", customerName: "Test customer", eventDate: "30/11/2026 at 10:00 PM", eventVenue: "Test venue", meal: "dinner", menuDishes: "Paneer", fallbackMessage: "Your booking is confirmed." };
  try {
    process.env.WHATSAPP_DEBUG = "0";
    process.env.WHATSAPP_HUB_USER = "test";
    process.env.WHATSAPP_HUB_PASS = "test";
    process.env.WHATSAPP_HUB_URL = "http://smstechhub.nnsolutions.co.in/api/sendmsgutil.php";
    process.env.WHATSAPP_ORDER_TEMPLATE = "order_alert_final";
    process.env.WHATSAPP_BOOKING_TEMPLATE = "order_pdf";
    globalThis.fetch = async (input) => {
      requests.push(new URL(String(input)));
      return new Response("Template rejected", { status: 400 });
    };
    const failed = await sendBookingConfirmation(options);
    assert.ok("error" in failed && failed.error.includes("Template rejected"));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].searchParams.get("text"), "customerorder");
    assert.equal(requests[0].pathname, "/api/sendmsgutil.php");
    assert.equal(requests[0].searchParams.get("Params"), [options.eventDate, options.eventVenue, options.meal].join(","));

    process.env.WHATSAPP_BOOKING_TEMPLATE = "order_pdf";
    process.env.WHATSAPP_HUB_URL = "http://smstechhub.nnsolutions.co.in/api/sendmsg.php";
    globalThis.fetch = async (input) => {
      requests.push(new URL(String(input)));
      return new Response("S. Message queued", { status: 200 });
    };
    assert.deepEqual(await sendBookingConfirmation(options), { success: true });
    assert.equal(requests.length, 2);
    assert.equal(requests[1].searchParams.get("text"), "customerorder");
    assert.equal(requests[1].pathname, "/api/sendmsgutil.php");
    const documentUrl = "https://example.com/api/menus/1/pdf?theme=standard&inline=true";
    const missingName = await sendMenuPdfViaWhatsApp(options.phone, documentUrl, "dinner-menu", "   ");
    assert.ok("error" in missingName && missingName.error.includes("recipient name"));
    assert.equal(requests.length, 2);
    assert.deepEqual(await sendMenuPdfViaWhatsApp("+91 99999 99999", documentUrl, "dinner-menu", "  Priya Sharma  "), { success: true });
    assert.equal(requests[2].pathname, "/api/sendmsgutil.php");
    assert.equal(requests[2].searchParams.get("text"), "orderdoc");
    assert.equal(requests[2].searchParams.get("phone"), "9999999999");
    assert.equal(requests[2].searchParams.get("htype"), "document");
    assert.equal(requests[2].searchParams.get("fname"), "dinner-menu");
    assert.equal(requests[2].searchParams.get("url"), documentUrl);
    assert.equal(requests[2].searchParams.get("Params"), "Priya Sharma");
    globalThis.fetch = async () => new Response("Document URL not accessible", { status: 422 });
    const documentError = await sendMenuPdfViaWhatsApp(options.phone, documentUrl, "dinner-menu", "Priya Sharma");
    assert.ok("error" in documentError && documentError.error.includes("Document URL not accessible"));
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, message: "Unsuccessful: template rejected" }), { headers: { "content-type": "application/json" } });
    const rejected = await sendBookingConfirmation(options);
    assert.ok("error" in rejected && rejected.error.includes("template rejected"), "HTTP 200 provider errors must remain errors");
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});
