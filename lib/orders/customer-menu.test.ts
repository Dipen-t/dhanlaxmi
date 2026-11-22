import assert from "node:assert/strict";
import test from "node:test";
import { planCustomerNotifications, type NotificationOrder } from "./notification-plan";
import { sendWhatsAppTemplateMessage } from "../whatsapp";

test("customer_menu_pdf reaches the utility endpoint with five correctly ordered parameters for both recipients", async () => {
  const keys = ["WHATSAPP_HUB_USER", "WHATSAPP_HUB_PASS", "WHATSAPP_HUB_URL", "WHATSAPP_DEBUG"];
  const previous = keys.map(key => process.env[key]);
  const originalFetch = globalThis.fetch;
  const requests: URL[] = [];
  try {
    process.env.WHATSAPP_HUB_USER = "test-user";
    process.env.WHATSAPP_HUB_PASS = "test-password";
    process.env.WHATSAPP_HUB_URL = "http://example.invalid/api/sendmsgutil.php";
    process.env.WHATSAPP_DEBUG = "false";
    globalThis.fetch = async input => { requests.push(new URL(String(input))); return new Response("S. Message queued"); };
    const order: NotificationOrder = { id: 1, customerName: "Mohit Raheja", customerPhone: "9999999999", date: "2026-11-20", venue: "Sky", mealType: "dinner", numberOfPersons: 100, extraPlates: 5, rawMaterials: [], menuDishes: [
      { dishId: 1, name: "Pineapple", categoryId: 1, categoryName: "Welcome Drinks" },
      { dishId: 2, name: "Tea", categoryId: 2, categoryName: "Hi Tea" },
    ] };
    const notifications = planCustomerNotifications({ ...order, menuDishes: [] }, order);
    for (const notification of notifications) {
      assert.deepEqual(await sendWhatsAppTemplateMessage({ phone: notification.phone, template: notification.payload.template, params: notification.payload.params }), { success: true });
    }
    assert.deepEqual(requests.map(request => request.searchParams.get("phone")), ["9999999999", "8080200800"]);
    for (const request of requests) {
      assert.equal(request.pathname, "/api/sendmsgutil.php");
      assert.equal(request.searchParams.get("text"), "customer_menu_pdf");
      assert.equal(request.searchParams.get("htype"), null);
      assert.deepEqual(request.searchParams.get("Params")!.split(","), ["Mohit Raheja", "20/11/2026", "Sky", "dinner", "105"]);
    }
    globalThis.fetch = async input => { requests.push(new URL(String(input))); return new Response("Template not approved", { status: 422 }); };
    const rejected = await sendWhatsAppTemplateMessage({ phone: notifications[0].phone, template: "customer_menu_pdf", params: notifications[0].payload.params });
    assert.ok("error" in rejected && rejected.error.includes("Template not approved"));
    assert.equal(requests.length, 3, "provider failures must not send a fallback message");
    assert.equal(requests[2].searchParams.get("text"), "customer_menu_pdf");
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; });
  }
});
