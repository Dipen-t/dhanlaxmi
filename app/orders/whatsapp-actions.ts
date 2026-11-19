"use server";

import { getOrder } from "@/app/orders/actions";
import { sendBookingConfirmation } from "@/lib/whatsapp";
import { sendOrderCustomerConfirmation } from "@/lib/orders/customer-confirmation";

export async function shareOrderViaWhatsApp(orderId: number) {
  try {
    return await sendOrderCustomerConfirmation(orderId, getOrder, sendBookingConfirmation);
  } catch {
    return { error: "Could not send the customer confirmation. Please try again." };
  }
}
