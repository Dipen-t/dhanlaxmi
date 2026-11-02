function formatWhatsAppPhone(receiver: string) {
  let digits = receiver.replace(/\D/g, "");
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

/** Free-text / attachment send via the existing ChatNexa JSON API. */
export async function sendWhatsAppMessage(
  receiver: string,
  message: string,
  attachment?: string,
  attachmentName?: string,
) {
  const apiUrl = process.env.WHATAPP_API;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;
  const bearerToken = process.env.WHATSAPP_BEARER_TOKEN;

  if (!apiUrl || !instanceId || !bearerToken) {
    console.error("WhatsApp configuration is missing from environment variables.");
    return { error: "WhatsApp configuration is missing." };
  }

  const formattedReceiver = formatWhatsAppPhone(receiver);

  const payload = {
    receiver: formattedReceiver,
    message,
    instance_id: instanceId,
    attachment: attachment || "",
    attachment_name: attachmentName || "",
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
      return {
        error: `WhatsApp API Error (${response.status}): Server returned non-JSON response.`,
      };
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return {
      error: `Fetch Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

function isWhatsAppHubConfigured() {
  return Boolean(
    process.env.WHATSAPP_HUB_USER?.trim() && process.env.WHATSAPP_HUB_PASS?.trim(),
  );
}

/**
 * Template WhatsApp via SMS Tech Hub (normal text + Params).
 * GET …/api/sendmsg.php?user=&pass=&sender=&phone=&text=TEMPLATE&priority=wa&stype=normal&Params=p1,p2,…
 */
export async function sendWhatsAppTemplateMessage(options: {
  phone: string;
  template: string;
  params: string[];
}) {
  const baseUrl =
    process.env.WHATSAPP_HUB_URL?.trim() ||
    "http://smstechhub.nnsolutions.co.in/api/sendmsg.php";
  const user = process.env.WHATSAPP_HUB_USER?.trim();
  const pass = process.env.WHATSAPP_HUB_PASS?.trim();
  const sender = process.env.WHATSAPP_HUB_SENDER?.trim() || "BUZWAP";

  if (!user || !pass) {
    console.error("WhatsApp Hub credentials are missing (WHATSAPP_HUB_USER / WHATSAPP_HUB_PASS).");
    return { error: "WhatsApp Hub configuration is missing." };
  }

  if (!options.template.trim()) {
    return { error: "WhatsApp template name is missing." };
  }

  const phone = formatWhatsAppPhone(options.phone);
  if (!phone) {
    return { error: "Vendor phone number is missing." };
  }

  // Params are comma-separated by the gateway — keep separators literal and
  // neutralize commas/newlines inside each value so splitting stays correct.
  const safeParams = options.params.map((value) => {
    const cleaned = String(value ?? "")
      .replace(/\r?\n+/g, " | ")
      .replace(/,/g, ";")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.length > 0 ? cleaned : "-";
  });

  const query = [
    `user=${encodeURIComponent(user)}`,
    `pass=${encodeURIComponent(pass)}`,
    `sender=${encodeURIComponent(sender)}`,
    `phone=${encodeURIComponent(phone)}`,
    `text=${encodeURIComponent(options.template.trim())}`,
    "priority=wa",
    "stype=normal",
    `Params=${safeParams.map(encodeURIComponent).join(",")}`,
  ].join("&");

  const url = `${baseUrl}?${query}`;

  try {
    const response = await fetch(url, { method: "GET" });
    const body = await response.text();

    if (!response.ok) {
      console.error(`WhatsApp Hub error (${response.status}):`, body);
      return { error: `WhatsApp Hub Error (${response.status}): ${body.slice(0, 200)}` };
    }

    const normalized = body.trim().toLowerCase();
    if (
      normalized.includes("error") &&
      !normalized.includes("success") &&
      !normalized.includes('"status":"ok"')
    ) {
      console.error("WhatsApp Hub rejected message:", body);
      return { error: `WhatsApp Hub Error: ${body.slice(0, 200)}` };
    }

    console.log(`WhatsApp Hub template queued for ${phone}`);
    return { success: true as const };
  } catch (error) {
    console.error("Error sending WhatsApp Hub template:", error);
    return {
      error: `Fetch Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/** Prefer Hub template API when configured; otherwise fall back to free-text JSON API. */
export async function sendNewOrderVendorAlert(options: {
  phone: string;
  orderId: string;
  dateLabel: string;
  venue: string;
  notesLine: string;
  materialsLine: string;
  fallbackMessage: string;
}) {
  const template =
    process.env.WHATSAPP_ORDER_TEMPLATE?.trim() || "New Order Alert";

  if (isWhatsAppHubConfigured()) {
    return sendWhatsAppTemplateMessage({
      phone: options.phone,
      template,
      params: [
        options.orderId,
        options.dateLabel,
        options.venue,
        options.notesLine,
        options.materialsLine,
      ],
    });
  }

  return sendWhatsAppMessage(options.phone, options.fallbackMessage);
}
