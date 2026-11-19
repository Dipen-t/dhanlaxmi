import assert from "node:assert/strict";
import { test } from "node:test";
import { sendBookingConfirmation, sendMenuPdfViaWhatsApp, sendWhatsAppPlainText, sendWhatsAppTemplateMessage } from "./whatsapp";

test("customer and PDF sends use exact templates and return provider errors without vendor fallback", async () => {
  const originalFetch = globalThis.fetch;
  const keys = ["WHATSAPP_DEBUG", "WHATSAPP_HUB_USER", "WHATSAPP_HUB_PASS", "WHATSAPP_BOOKING_TEMPLATE", "WHATSAPP_ORDER_TEMPLATE", "WHATSAPP_HUB_URL"];
  const previous = keys.map((key) => process.env[key]);
  const requests: URL[] = [];
  const managerRequests: URL[] = [];
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
    assert.equal(requests[0].searchParams.get("Params"), ["30/11/2026", options.eventVenue, options.meal].join(","));

    process.env.WHATSAPP_BOOKING_TEMPLATE = "order_pdf";
    process.env.WHATSAPP_HUB_URL = "http://smstechhub.nnsolutions.co.in/api/sendmsg.php";
    globalThis.fetch = async (input) => {
      const request = new URL(String(input));
      if (request.searchParams.get("phone") === "8080200800") managerRequests.push(request);
      else requests.push(request);
      return new Response("S. Message queued", { status: 200 });
    };
    assert.deepEqual(await sendBookingConfirmation(options), { success: true });
    assert.equal(requests.length, 2);
    assert.equal(requests[1].searchParams.get("text"), "customerorder");
    assert.equal(requests[1].pathname, "/api/sendmsgutil.php");
    assert.equal(managerRequests.length, 0, "Booking confirmation must never be copied to the manager");
    const documentUrl = "https://example.com/api/menus/1/pdf?theme=standard&inline=true";
    const missingName = await sendMenuPdfViaWhatsApp(options.phone, documentUrl, "dinner-menu", "   ");
    assert.ok("error" in missingName && missingName.error.includes("recipient name"));
    assert.equal(requests.length, 2);
    assert.deepEqual(await sendMenuPdfViaWhatsApp("+91 99999 99999", documentUrl, "dinner-menu", "  Priya Sharma  "), { success: true });
    assert.equal(requests[2].pathname, "/api/sendmsgutil.php");
    assert.equal(requests[2].searchParams.get("text"), "orderdoc1");
    assert.equal(requests[2].searchParams.get("phone"), "9999999999");
    assert.equal(requests[2].searchParams.get("htype"), "document");
    assert.equal(requests[2].searchParams.get("fname"), "dinner-menu");
    assert.equal(requests[2].searchParams.get("url"), documentUrl);
    assert.equal(requests[2].searchParams.get("Params"), "Priya Sharma");
    const vendorAlert = await sendWhatsAppTemplateMessage({
      phone: options.phone,
      template: "order_alert_final",
      params: [options.eventDate, options.eventVenue, options.menuDishes, "Test notes"],
    });
    assert.deepEqual(vendorAlert, { success: true });
    assert.equal(requests[3].pathname, "/api/sendmsgutil.php");
    assert.equal(requests[3].searchParams.get("text"), "order_alert_final");
    assert.equal(requests[3].searchParams.get("Params"), [options.eventDate, options.eventVenue, options.menuDishes, "Test notes"].join(","));
    assert.deepEqual(await sendBookingConfirmation({ ...options, eventDate: "17/11/2026" }), { success: true });
    assert.equal(requests[4].searchParams.get("Params"), "17/11/2026,Test venue,dinner");
    assert.equal(managerRequests.length, 0);
    let plainRequest: URL | undefined;
    globalThis.fetch = async input => { plainRequest = new URL(String(input)); return new Response("S. Message queued"); };
    assert.deepEqual(await sendWhatsAppPlainText("8080200800", "Selected menu\nSoup\nPaneer"), { success: true });
    assert.equal(plainRequest!.searchParams.get("htype"), "normal");
    assert.equal(plainRequest!.searchParams.get("text"), "Selected menu\nSoup\nPaneer");
    assert.equal(plainRequest!.searchParams.has("Params"), false);
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
