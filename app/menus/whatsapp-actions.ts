"use server";

import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function sendCategoryWhatsApp(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return { error: "Enter a valid recipient phone number." };
  }
  if (!text.trim() || text.length > 30000) {
    return { error: "Select categories to share. The message must be under 30,000 characters." };
  }
  return sendWhatsAppMessage(digits, text);
}
