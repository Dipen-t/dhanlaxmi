type WhatsAppResult = { success: true } | { error: string };

type WhatsAppChannel = "smstechhub" | "hub-template" | "new-order-alert" | "booking-confirmation";

let whatsAppCallSeq = 0;

function whatsAppDebugEnabled() {
  const flag = process.env.WHATSAPP_DEBUG?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  // Default on so Termux / production logs show delivery attempts.
  return true;
}

function nextWhatsAppCallId() {
  whatsAppCallSeq += 1;
  const stamp = new Date().toISOString().replace("T", " ").replace("Z", "");
  return `WA-${stamp}-${String(whatsAppCallSeq).padStart(4, "0")}`;
}

function redactSecret(value: string | undefined | null) {
  if (!value) return "(empty)";
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}…${value.slice(-2)} (${value.length} chars)`;
}

/** Hide pass / bearer / token query values while keeping the rest readable. */
function redactUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    for (const key of ["pass", "password", "token", "bearer", "auth"]) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, "***REDACTED***");
      }
    }
    return url.toString();
  } catch {
    return rawUrl
      .replace(/([?&](?:pass|password|token|bearer)=)[^&]*/gi, "$1***REDACTED***");
  }
}

function truncate(value: string, max = 2000) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}… [truncated ${value.length - max} more chars]`;
}

function previewText(value: string, max = 280) {
  return truncate(value.replace(/\s+/g, " ").trim(), max);
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function logBanner(callId: string, title: string, channel: WhatsAppChannel) {
  if (!whatsAppDebugEnabled()) return;
  console.log(
    [
      "",
      "════════════════════════════════════════════════════════════",
      `  ${title}`,
      `  callId : ${callId}`,
      `  channel: ${channel}`,
      `  time   : ${new Date().toISOString()}`,
      "════════════════════════════════════════════════════════════",
    ].join("\n"),
  );
}

function logSection(callId: string, label: string, details: Record<string, unknown>) {
  if (!whatsAppDebugEnabled()) return;
  console.log(`\n[${callId}] ▶ ${label}`);
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined) continue;
    const printed =
      typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value, null, 2);
    const indented = printed
      .split("\n")
      .map((line, index) => (index === 0 ? line : `         ${line}`))
      .join("\n");
    console.log(`  ${key.padEnd(14)} ${indented}`);
  }
}

function logEnd(callId: string, ok: boolean, summary: string, durationMs: number) {
  if (!whatsAppDebugEnabled()) return;
  console.log(
    [
      "",
      "────────────────────────────────────────────────────────────",
      `  [${callId}] ${ok ? "SUCCESS" : "FAILED"} in ${formatDuration(durationMs)}`,
      `  ${summary}`,
      "════════════════════════════════════════════════════════════",
      "",
    ].join("\n"),
  );
}

function formatWhatsAppPhone(receiver: string) {
  let digits = receiver.replace(/\D/g, "");
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

async function readResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "(none)";
  const raw = await response.text();
  let parsed: unknown = null;
  if (contentType.includes("application/json") && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }
  return { contentType, raw, parsed };
}

function responseHeaderSnapshot(response: Response) {
  const interesting = [
    "content-type",
    "content-length",
    "date",
    "server",
    "x-request-id",
    "x-correlation-id",
  ];
  const out: Record<string, string> = {};
  for (const key of interesting) {
    const value = response.headers.get(key);
    if (value) out[key] = value;
  }
  return out;
}

function isWhatsAppHubConfigured() {
  return Boolean(
    process.env.WHATSAPP_HUB_USER?.trim() && process.env.WHATSAPP_HUB_PASS?.trim(),
  );
}

/** Send message via SMS Tech Hub using the approved order_alert_final template. */
export async function sendWhatsAppMessage(
  receiver: string,
  message: string,
  _attachment?: string,
  _attachmentName?: string,
): Promise<WhatsAppResult> {
  const callId = nextWhatsAppCallId();
  const started = Date.now();
  logBanner(callId, "WhatsApp SEND (SMS Tech Hub)", "smstechhub");

  if (!isWhatsAppHubConfigured()) {
    const error = "SMS Tech Hub credentials are missing in .env (WHATSAPP_HUB_USER / WHATSAPP_HUB_PASS).";
    logSection(callId, "ABORT", { reason: error });
    logEnd(callId, false, error, Date.now() - started);
    return { error };
  }

  // Parse lines to populate template parameters {{1}}=Date, {{2}}=Venue, {{3}}=Details, {{4}}=Notes
  const dateMatch = message.match(/Date:\s*([^\n\r]+)/i);
  const timeMatch = message.match(/Event time:\s*([^\n\r]+)/i);
  const venueMatch = message.match(/Venue:\s*([^\n\r]+)/i);
  const customerMatch = message.match(/Customer:\s*([^\n\r]+)/i);
  const mealMatch = message.match(/Meal:\s*([^\n\r]+)/i);
  const personsMatch = message.match(/Persons:\s*([^\n\r]+)/i);

  const rawDate = dateMatch ? dateMatch[1].trim() : "-";
  const dateVal = timeMatch ? `${rawDate} at ${timeMatch[1].trim()}` : rawDate;
  const venueVal = venueMatch ? venueMatch[1].trim() : "-";

  // Filter out redundant header lines so {{3}} contains the actual items/dishes cleanly
  const contentLines = message
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((line) => {
      if (!line) return false;
      if (/^(Order\s+ORD-|Date:|Event time:|Venue:|Customer:|Phone:|Meal:|Persons:)/i.test(line)) {
        return false;
      }
      return true;
    });

  const detailsVal =
    contentLines.length > 0
      ? contentLines
          .map((line) => (line.startsWith("-") || line.startsWith("•") || line.startsWith("*") ? line : `• ${line}`))
          .join("  |  ")
      : "Order details confirmed";

  // Build notes line for {{4}}
  const noteParts: string[] = [];
  if (customerMatch) noteParts.push(`Customer: ${customerMatch[1].trim()}`);
  if (mealMatch) noteParts.push(`Meal: ${mealMatch[1].trim()}`);
  if (personsMatch) noteParts.push(`Plates: ${personsMatch[1].trim()}`);
  noteParts.push("Dhanlaxmi Caterer");
  const notesVal = noteParts.join(" · ");

  const template = process.env.WHATSAPP_ORDER_TEMPLATE?.trim() || "order_alert_final";

  return sendWhatsAppTemplateMessage({
    phone: receiver,
    template,
    params: [dateVal, venueVal, detailsVal, notesVal],
  });
}

/**
 * Template WhatsApp via SMS Tech Hub (normal text + Params).
 * GET …/api/sendmsg.php?user=&pass=&sender=&phone=&text=TEMPLATE&priority=wa&stype=normal&Params=p1,p2,…
 */
export async function sendWhatsAppTemplateMessage(options: {
  phone: string;
  template: string;
  params: string[];
}): Promise<WhatsAppResult> {
  const callId = nextWhatsAppCallId();
  const started = Date.now();
  logBanner(callId, "WhatsApp SEND (SMS Tech Hub template)", "hub-template");

  const baseUrl =
    process.env.WHATSAPP_HUB_URL?.trim() ||
    "http://smstechhub.nnsolutions.co.in/api/sendmsgutil.php";
  const user = process.env.WHATSAPP_HUB_USER?.trim();
  const pass = process.env.WHATSAPP_HUB_PASS?.trim();
  const sender = process.env.WHATSAPP_HUB_SENDER?.trim() || "BUZWAP";

  logSection(callId, "CONFIG", {
    baseUrl,
    user: user || "(missing WHATSAPP_HUB_USER)",
    pass: pass ? redactSecret(pass) : "(missing WHATSAPP_HUB_PASS)",
    sender,
    hubConfigured: isWhatsAppHubConfigured(),
  });

  if (!user || !pass) {
    const error = "WhatsApp Hub configuration is missing.";
    logSection(callId, "ABORT", { reason: error });
    logEnd(callId, false, error, Date.now() - started);
    return { error };
  }

  if (!options.template.trim()) {
    const error = "WhatsApp template name is missing.";
    logSection(callId, "ABORT", { reason: error });
    logEnd(callId, false, error, Date.now() - started);
    return { error };
  }

  const phone = formatWhatsAppPhone(options.phone);
  if (!phone) {
    const error = "Vendor phone number is missing.";
    logSection(callId, "ABORT", { reason: error, phoneRaw: options.phone });
    logEnd(callId, false, error, Date.now() - started);
    return { error };
  }

  // Params are comma-separated by the gateway — keep separators literal and
  // neutralize commas inside each value so splitting stays correct.
  // Meta Cloud API strictly forbids raw newlines (\n / \r) inside template params (#100 error).
  // We format linebreaks with clean inline dividers ("  |  ").
  const safeParams = options.params.map((value, index) => {
    const rawStr = String(value ?? "");
    const cleaned = rawStr
      .replace(/,/g, ";")
      .replace(/\r?\n+/g, "  |  ")
      .trim();
    return {
      index: index + 1,
      originalChars: rawStr.length,
      value: cleaned.length > 0 ? cleaned : "Dhanlaxmi Caterer",
    };
  });

  const query = [
    `user=${encodeURIComponent(user)}`,
    `pass=${encodeURIComponent(pass)}`,
    `sender=${encodeURIComponent(sender)}`,
    `phone=${encodeURIComponent(phone)}`,
    `text=${encodeURIComponent(options.template.trim())}`,
    "priority=wa",
    "stype=normal",
    `Params=${safeParams.map((p) => encodeURIComponent(p.value)).join(",")}`,
  ].join("&");

  const url = `${baseUrl}?${query}`;

  logSection(callId, "REQUEST", {
    method: "GET",
    urlRedacted: redactUrl(url),
    phoneRaw: options.phone,
    phoneFormatted: phone,
    template: options.template.trim(),
    priority: "wa",
    stype: "normal",
    paramCount: safeParams.length,
    params: safeParams.map((p) => `{{${p.index}}} = ${previewText(p.value, 400)}`),
  });

  try {
    const response = await fetch(url, { method: "GET" });
    const { contentType, raw, parsed } = await readResponseBody(response);
    const durationMs = Date.now() - started;

    logSection(callId, "RESPONSE", {
      httpStatus: `${response.status} ${response.statusText || ""}`.trim(),
      ok: response.ok,
      duration: formatDuration(durationMs),
      contentType,
      headers: responseHeaderSnapshot(response),
      bodyRaw: truncate(raw || "(empty body)"),
      bodyJson: parsed ?? "(not JSON / parse failed)",
      bodyLength: raw.length,
    });

    if (!response.ok) {
      const error = `WhatsApp Hub Error (${response.status}): ${raw.slice(0, 200)}`;
      logEnd(callId, false, error, durationMs);
      return { error };
    }

    const normalized = raw.trim().toLowerCase();
    const isSuccess =
      raw.trim().startsWith("S.") ||
      normalized.includes("success") ||
      normalized.includes('"status":"ok"');

    if (!isSuccess) {
      if (normalized.includes("no sufficient credits") || normalized.includes("insufficient")) {
        const error = `SMS Tech Hub Error: No Sufficient Credits in account (${user}). Please recharge WhatsApp credits.`;
        logEnd(callId, false, error, durationMs);
        return { error };
      }
      const error = `SMS Tech Hub Error: ${raw.trim().slice(0, 200)}`;
      logEnd(callId, false, error, durationMs);
      return { error };
    }

    logEnd(callId, true, `Hub template queued for ${phone} (${options.template.trim()}) -> ${raw.trim()}`, durationMs);
    return { success: true };
  } catch (error) {
    const durationMs = Date.now() - started;
    const messageText = error instanceof Error ? error.message : "Unknown error";
    logSection(callId, "NETWORK ERROR", {
      name: error instanceof Error ? error.name : typeof error,
      message: messageText,
      stack: error instanceof Error ? error.stack : undefined,
    });
    logEnd(callId, false, `Fetch Error: ${messageText}`, durationMs);
    return { error: `Fetch Error: ${messageText}` };
  }
}

/**
 * Vendor order-alert via the approved "order_alert_final" Hub template.
 *
 * Template body:
 *   New Order Alert!
 *   Date: {{1}}
 *   Venue: {{2}}
 *   Please provide the following raw materials:
 *   {{3}}
 *
 *   {{4}}
 *   Thankyou.
 *
 * {{1}} = date + time label   {{2}} = venue
 * {{3}} = materials list      {{4}} = optional High Tea / notes line (or "-")
 */
export async function sendNewOrderVendorAlert(options: {
  phone: string;
  orderId: string;
  dateLabel: string;
  venue: string;
  notesLine: string;
  materialsLine: string;
  fallbackMessage: string;
}): Promise<WhatsAppResult> {
  const callId = nextWhatsAppCallId();
  const started = Date.now();
  logBanner(callId, "WhatsApp NEW ORDER vendor alert", "new-order-alert");

  const template =
    process.env.WHATSAPP_ORDER_TEMPLATE?.trim() || "order_alert_final";
  // Use the Hub template ("order_alert_final") when Hub credentials are
  // present; fall back to the ChatNexa free-text path otherwise.
  const useHub = isWhatsAppHubConfigured();

  logSection(callId, "ROUTING", {
    orderId: options.orderId,
    phoneRaw: options.phone,
    phoneFormatted: formatWhatsAppPhone(options.phone),
    dateLabel: options.dateLabel,
    venue: options.venue,
    notesLine: previewText(options.notesLine || "(empty)"),
    materialsPreview: previewText(options.materialsLine, 500),
    template,
    path: useHub ? "hub-template (SMS Tech Hub — order_alert_final)" : "chatnexa fallback (free text)",
    hubConfigured: useHub,
  });

  let result: WhatsAppResult;
  if (useHub) {
    // 4-param template: {{1}} date, {{2}} venue, {{3}} materials, {{4}} notes
    result = await sendWhatsAppTemplateMessage({
      phone: options.phone,
      template,
      params: [
        options.dateLabel,
        options.venue,
        options.materialsLine,
        options.notesLine && options.notesLine.trim() ? options.notesLine : " ",
      ],
    });
  } else {
    result = { error: "WhatsApp Hub configuration is missing (WHATSAPP_HUB_USER / WHATSAPP_HUB_PASS)." };
  }

  logSection(callId, "ALERT RESULT", {
    ok: !("error" in result),
    result,
    parentDuration: formatDuration(Date.now() - started),
  });
  logEnd(
    callId,
    !("error" in result),
    "error" in result
      ? `New-order alert failed for ${options.orderId}: ${result.error}`
      : `New-order alert finished for ${options.orderId}`,
    Date.now() - started,
  );

  return result;
}

/**
 * Customer booking-confirmation via the approved "order_pdf" Hub template,
 * plus the menu PDF sent as an attachment through ChatNexa.
 *
 * Template body (order_pdf):
 *   Hello User,
 *   Kindly find the menu.
 *   Thankyou.
 *   (PDF attachment delivered separately via ChatNexa)
 *
 * When Hub credentials are absent the function falls back to a free-text
 * ChatNexa message (without the template, but still with the PDF if provided).
 */
export async function sendBookingConfirmation(options: {
  phone: string;
  customerName: string;
  eventDate: string;
  eventVenue: string;
  meal: string;
  menuDishes: string;
  pdfBase64?: string;
  pdfFilename?: string;
  fallbackMessage: string;
}): Promise<WhatsAppResult> {
  const callId = nextWhatsAppCallId();
  const started = Date.now();
  logBanner(callId, "WhatsApp BOOKING CONFIRMATION (order_pdf)", "booking-confirmation");

  const template =
    process.env.WHATSAPP_BOOKING_TEMPLATE?.trim() || "order_pdf";
  const useHub = isWhatsAppHubConfigured();

  logSection(callId, "ROUTING", {
    phoneRaw: options.phone,
    phoneFormatted: formatWhatsAppPhone(options.phone),
    customerName: options.customerName,
    eventDate: options.eventDate,
    eventVenue: options.eventVenue,
    meal: options.meal,
    menuDishesPreview: previewText(options.menuDishes, 300),
    template,
    hasPdf: Boolean(options.pdfBase64),
    pdfFilename: options.pdfFilename || "(none)",
    path: useHub
      ? "hub-template (order_pdf) + ChatNexa PDF attachment"
      : "chatnexa free-text + PDF attachment",
    hubConfigured: useHub,
  });

  let templateResult: WhatsAppResult;

  if (useHub) {
    const dishesClean = options.menuDishes
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && l !== "(menu not selected)")
      .map((l) => (l.startsWith("-") || l.startsWith("•") || l.startsWith("*") ? l : `• ${l}`))
      .join("  |  ") || "Menu confirmed";

    const customerNotes = [
      options.customerName ? `Customer: ${options.customerName}` : "",
      options.meal ? `Meal: ${options.meal}` : "",
      "Dhanlaxmi Caterer",
    ]
      .filter(Boolean)
      .join("  |  ");

    if (template === "order_pdf") {
      // First attempt order_pdf
      templateResult = await sendWhatsAppTemplateMessage({
        phone: options.phone,
        template: "order_pdf",
        params: [],
      });

      // If order_pdf is not supported on the Utility endpoint (sendmsgutil.php),
      // fall back to the approved utility template order_alert_final so the customer receives the booking confirmation.
      if ("error" in templateResult) {
        logSection(callId, "BOOKING FALLBACK", {
          reason: templateResult.error,
          fallbackTemplate: "order_alert_final",
        });
        templateResult = await sendWhatsAppTemplateMessage({
          phone: options.phone,
          template: "order_alert_final",
          params: [
            options.eventDate,
            options.eventVenue,
            dishesClean,
            customerNotes,
          ],
        });
      }
    } else {
      // Send the configured utility template directly
      templateResult = await sendWhatsAppTemplateMessage({
        phone: options.phone,
        template,
        params: [
          options.eventDate,
          options.eventVenue,
          dishesClean,
          customerNotes,
        ],
      });
    }
  } else {
    templateResult = { error: "WhatsApp Hub configuration is missing (WHATSAPP_HUB_USER / WHATSAPP_HUB_PASS)." };
  }

  logSection(callId, "TEMPLATE RESULT", {
    ok: !("error" in templateResult),
    result: templateResult,
  });

  const ok = !("error" in templateResult);
  const summary = ok
    ? `Booking confirmation sent to ${formatWhatsAppPhone(options.phone)} via SMS Tech Hub (${template})`
    : `Failed: ${"error" in templateResult ? templateResult.error : "Unknown error"}`;

  logEnd(callId, ok, summary, Date.now() - started);

  if (!ok) {
    return templateResult;
  }
  return { success: true };
}
