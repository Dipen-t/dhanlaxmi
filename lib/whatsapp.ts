export async function sendWhatsAppMessage(receiver: string, message: string, attachment?: string) {
  const apiUrl = process.env.WHATAPP_API;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;
  const bearerToken = process.env.WHATSAPP_BEARER_TOKEN;

  if (!apiUrl || !instanceId || !bearerToken) {
    console.error("WhatsApp configuration is missing from environment variables.");
    return false;
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

    const data = await response.json();
    if (data.status === "success") {
      console.log(`WhatsApp message queued for ${formattedReceiver}`);
      return true;
    } else {
      console.error("WhatsApp message failed:", data);
      return false;
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return false;
  }
}
