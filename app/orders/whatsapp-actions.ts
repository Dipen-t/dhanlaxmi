"use server";

import { getOrder } from "@/app/orders/actions";
import { formatEventTime } from "@/lib/orders/event-time";
import { normalizeWhatsAppHubPhone, sendBookingConfirmation, sendWhatsAppMessage } from "@/lib/whatsapp";

export async function shareOrderViaWhatsApp(orderId: number, phone: string, text: string) {
  const digits = normalizeWhatsAppHubPhone(phone);
  if (!digits) return { error: "Enter a valid 10-digit Indian phone number." };

  const order = await getOrder(String(orderId));
  if (!order) return { error: "Order not found." };

  if (digits === normalizeWhatsAppHubPhone(order.customerPhone ?? "")) {
    const date = order.date.split("-").reverse().join("/");
    const time = formatEventTime(order.eventTime);
    return sendBookingConfirmation({
      phone: digits,
      customerName: order.customerName || "Customer",
      eventDate: time ? `${date} at ${time}` : date,
      eventVenue: order.venue,
      meal: order.mealType,
      menuDishes: "",
      fallbackMessage: "",
    });
  }

  if (!text.trim() || text.length > 30000) return { error: "The order message is empty or too long." };
  return sendWhatsAppMessage(digits, text);
}
