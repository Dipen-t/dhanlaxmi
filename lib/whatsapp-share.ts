/** Client-safe WhatsApp URL helpers (wa.me / api.whatsapp.com). */

export function normalizeWhatsAppPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  return digits;
}

export function buildWhatsAppShareUrl(phone: string | null | undefined, text: string): string {
  const message = encodeURIComponent(text);
  const digits = phone ? normalizeWhatsAppPhone(phone) : "";
  if (digits) {
    return `https://wa.me/${digits}?text=${message}`;
  }
  return `https://api.whatsapp.com/send?text=${message}`;
}

export function openWhatsAppShare(phone: string | null | undefined, text: string) {
  const url = buildWhatsAppShareUrl(phone, text);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function buildKitchenMenuShareText(input: {
  name: string;
  venue?: string | null;
  dateLabel?: string | null;
  numberOfPersons?: number | null;
  mealType?: string | null;
  categories: { name: string; dishes: { name: string; quantity?: string }[] }[];
}) {
  const lines = [`Kitchen menu: ${input.name}`];
  if (input.venue) lines.push(`Venue: ${input.venue}`);
  if (input.dateLabel) lines.push(`Date: ${input.dateLabel}`);
  if (input.numberOfPersons) lines.push(`Persons: ${input.numberOfPersons}`);
  if (input.mealType) lines.push(`Meal: ${input.mealType}`);
  lines.push("");
  for (const category of input.categories) {
    lines.push(`*${category.name}*`);
    for (const dish of category.dishes) {
      lines.push(dish.quantity ? `- ${dish.name} (${dish.quantity})` : `- ${dish.name}`);
    }
    lines.push("");
  }
  lines.push("Download the kitchen PDF from the app if you need the print layout.");
  return lines.join("\n").trim();
}

export function buildCategoryStallShareText(input: {
  menuName: string;
  venueHint?: string;
  categories: { name: string; dishes: { name: string }[] }[];
}) {
  const lines = [
    `Stall arrangement for *${input.menuName}*`,
    input.venueHint ? `Venue: ${input.venueHint}` : null,
    "",
    "Selected categories for the manager:",
    "",
  ].filter((line): line is string => line != null);

  for (const category of input.categories) {
    lines.push(`*${category.name}* (${category.dishes.length} items)`);
    for (const dish of category.dishes) {
      lines.push(`- ${dish.name}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function buildOrderShareText(input: {
  orderId: string;
  date: string;
  venue: string;
  customerName?: string | null;
  customerPhone?: string | null;
  mealType: string;
  numberOfPersons: number;
  menuName?: string | null;
  menuDishes?: { categoryName: string; name: string }[];
}) {
  const [y, m, d] = input.date.split("-");
  const dateLabel = d && m && y ? `${d}/${m}/${y}` : input.date;
  const lines = [
    `Order ${input.orderId}`,
    `Date: ${dateLabel}`,
    `Venue: ${input.venue}`,
    input.customerName ? `Customer: ${input.customerName}` : null,
    input.customerPhone ? `Phone: ${input.customerPhone}` : null,
    `Meal: ${input.mealType}`,
    `Persons: ${input.numberOfPersons}`,
  ].filter((line): line is string => line != null);

  if (input.menuName) {
    lines.push("", `Menu: ${input.menuName}`);
  }
  if (input.menuDishes && input.menuDishes.length > 0) {
    const byCat = new Map<string, string[]>();
    for (const dish of input.menuDishes) {
      const list = byCat.get(dish.categoryName) ?? [];
      list.push(dish.name);
      byCat.set(dish.categoryName, list);
    }
    lines.push("");
    for (const [category, dishes] of byCat) {
      lines.push(`*${category}*`);
      lines.push(dishes.map((name) => `- ${name}`).join("\n"));
    }
  }
  return lines.join("\n").trim();
}
