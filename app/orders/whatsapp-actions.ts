"use server";

import { getOrder } from "@/app/orders/actions";
import { db } from "@/db";
import { dispatchOrderMessages, ensureWhatsappOutbox, getOrderMessages, queueCustomerNotifications, retryOrderMessage, acknowledgeManualMessage } from "@/lib/orders/whatsapp-outbox";
import { normalizeWhatsAppHubPhone } from "@/lib/whatsapp-phone";
import { BOOKING_MANAGER_PHONE } from "@/lib/whatsapp-booking-config";
import { revalidatePath } from "next/cache";

export async function shareOrderViaWhatsApp(orderId: number) {
  try {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) return { error: "Invalid order." };
    const order = await getOrder(String(orderId));
    if (!order) return { error: "Order not found." };
    const phone1 = normalizeWhatsAppHubPhone(order.customerPhone ?? "");
    const phone2 = normalizeWhatsAppHubPhone(order.customer2Phone ?? "");
    const hasCustomer1 = phone1 && phone1 !== BOOKING_MANAGER_PHONE;
    const hasCustomer2 = phone2 && phone2 !== BOOKING_MANAGER_PHONE;

    if (!hasCustomer1 && !hasCustomer2) {
      if (phone1 === BOOKING_MANAGER_PHONE || phone2 === BOOKING_MANAGER_PHONE) {
        return { error: "The saved customer number belongs to manager Sunny. Enter the customer's number first." };
      }
      return { error: "Add a valid customer phone number by editing this order first." };
    }
    await ensureWhatsappOutbox();
    const queued = await db.transaction(transaction => queueCustomerNotifications(transaction, null, order));
    const ids = queued.map(row => row.id);
    await dispatchOrderMessages(orderId, ids);
    const rows = (await getOrderMessages(orderId)).filter(row => ids.includes(row.id));
    const customerMessages = rows.filter(row => row.recipientKind === "customer");
    revalidatePath("/orders");
    const anyCustomerFailed = customerMessages.some(row => row.status === "failed" || row.status === "unknown");
    if (anyCustomerFailed && customerMessages.every(row => row.status === "failed" || row.status === "unknown")) {
      const firstError = customerMessages.find(row => row.lastError)?.lastError;
      return { error: firstError || "Customer confirmation failed. Retry it from history." };
    }
    const pending = rows.filter(row => row.status !== "accepted");
    return { success: true as const, accepted: pending.length === 0, warning: pending.map(row => `${row.recipientName}: ${row.lastError || row.status}`).join("; ") || undefined };
  } catch {
    return { error: "Could not send the customer confirmation. Please try again." };
  }
}

export async function getOrderWhatsappHistory(orderId: number) {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) throw new Error("Invalid order.");
  return getOrderMessages(orderId);
}

export async function retryOrderWhatsapp(orderId: number, messageId: number, acknowledgeUnknown = false) {
  if (![orderId, messageId].every(id => Number.isSafeInteger(id) && id > 0)) return { error: "Invalid message." };
  try {
    const result = await retryOrderMessage(orderId, messageId, acknowledgeUnknown);
    revalidatePath("/orders");
    return result;
  } catch { return { error: "Could not retry this recipient. Refresh its status before trying again." }; }
}

export async function markVendorContacted(orderId: number, messageId: number) {
  if (![orderId, messageId].every(id => Number.isSafeInteger(id) && id > 0)) return { error: "Invalid message." };
  await acknowledgeManualMessage(orderId, messageId);
  revalidatePath("/orders");
  return { success: true as const };
}
