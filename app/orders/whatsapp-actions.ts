"use server";

import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function shareOrderViaWhatsApp(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return { error: "Enter a valid phone number." };
  if (!text.trim() || text.length > 30000) return { error: "The order message is empty or too long." };
  return sendWhatsAppMessage(digits, text);
}
