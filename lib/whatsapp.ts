export async function sendWhatsAppMessage(receiver: string, message: string, attachment?: string) {
  const apiUrl = process.env.WHATAPP_API;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;
  const bearerToken = process.env.WHATSAPP_BEARER_TOKEN;

  if (!apiUrl || !instanceId || !bearerToken) {
    console.error("WhatsApp configuration is missing from environment variables.");
    return { error: "WhatsApp configuration is missing." };
  }

  // Ensure phone number has country code (e.g., 91 for India) if it's 10 digits
  let formattedReceiver = receiver.replace(/\D/g, "");
  if (formattedReceiver.length === 10) {
    formattedReceiver = `91${formattedReceiver}`;
  }

  const payload = {
    receiver: formattedReceiver,
    message,
    instance_id: instanceId,
    attachment: attachment || "",
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (data.status === "success" || data.success) {
        console.log(`WhatsApp message queued for ${formattedReceiver}`);
        return { success: true };
      } else {
        console.error("WhatsApp message failed:", data);
        return { error: `WhatsApp API Error: ${JSON.stringify(data)}` };
      }
    } else {
      const text = await response.text();
      console.error(`WhatsApp API returned non-JSON (${response.status}):`, text);
      return { error: `WhatsApp API Error (${response.status}): Server returned non-JSON response.` };
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return { error: `Fetch Error: ${error instanceof Error ? error.message : "Unknown error"}` };
  }
}
