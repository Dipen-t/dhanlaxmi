import { formatEventTime } from "./event-time";
import { groupMaterialsByVendorTiming, vendorScheduleLabel } from "./vendor-timing";
import { BOOKING_MANAGER_NAME, BOOKING_MANAGER_PHONE } from "../whatsapp-booking-config";
import { normalizeWhatsAppHubPhone } from "../whatsapp-phone";
import { isHiTeaCategory, normalizeHiTeaNotes } from "./hi-tea";

export const CUSTOMER_MENU_TEMPLATE = "customer_menu_pdf";

export type NotificationMaterial = { rawMaterialId: number; vendorId?: number | null; timing?: string | null; unitQty: string; unitName: string; notes?: string | null };
export type NotificationOrder = {
  id: number; date: string; venue: string; mealType: string; numberOfPersons: number; extraPlates: number;
  customerName: string | null; customerPhone: string | null;
  customer2Name?: string | null; customer2Phone?: string | null;
  hiTeaNotes?: string | null;
  rawMaterials: NotificationMaterial[];
  menuDishes: { dishId: number; name: string; categoryId: number; categoryName: string }[];
};

function materialKey(items: NotificationMaterial[]) {
  return JSON.stringify(items.map(item => [item.rawMaterialId, String(Number(item.unitQty)), item.unitName.trim().toLowerCase(), item.notes?.trim() || "", item.timing?.trim() || ""]).sort((a, b) => Number(a[0]) - Number(b[0])));
}

export function planVendorChanges(before: NotificationOrder | null, next: NotificationOrder) {
  const oldGroups = before ? groupMaterialsByVendorTiming(before.rawMaterials, before.mealType) : [];
  const newGroups = groupMaterialsByVendorTiming(next.rawMaterials, next.mealType);
  const scheduleChanged = !!before && (before.date !== next.date || before.venue !== next.venue || before.mealType !== next.mealType || before.numberOfPersons + before.extraPlates !== next.numberOfPersons + next.extraPlates);

  // Check if anything changed at all across any vendor group.
  const anyGroupChanged = newGroups.some(group => {
    const previous = oldGroups.find(old => old.vendorId === group.vendorId);
    return !previous || scheduleChanged || materialKey(previous.items) !== materialKey(group.items);
  });

  // When editing (before != null) and something changed, resend the complete list
  // to ALL vendors so every vendor sees the full updated picture — not just the
  // vendors whose own items changed.
  const updates = newGroups.filter(group => {
    if (!before) {
      // New order: only send to vendors that have items.
      return true;
    }
    // Edit: if anything changed anywhere, notify ALL vendor groups.
    if (anyGroupChanged) return true;
    // Nothing changed at all — skip.
    return false;
  });

  const removed = oldGroups.flatMap(group => {
    const items = group.items.filter(old => !newGroups.some(current =>
      current.vendorId === group.vendorId && current.items.some(item => item.rawMaterialId === old.rawMaterialId),
    ));
    return items.length ? [{ ...group, items }] : [];
  });
  return { updates, removed };
}

export function selectedMenuText(order: NotificationOrder) {
  const lines = ["Dhanlaxmi Caterer", `Customer: ${order.customerName || "Customer"}`, `Date: ${order.date.split("-").reverse().join("/")}`, `Venue: ${order.venue}`, `Meal: ${order.mealType}`, `Plates: ${order.numberOfPersons + order.extraPlates}`, "", "Selected menu"];
  const regularDishes = order.menuDishes.filter(d => !isHiTeaCategory(d.categoryName));
  const hiTeaDishes = order.menuDishes.filter(d => isHiTeaCategory(d.categoryName));

  for (const dish of regularDishes) {
    lines.push(`• ${dish.name}`);
  }

  let currentCategory = "";
  for (const dish of hiTeaDishes) {
    if (dish.categoryName !== currentCategory) {
      currentCategory = dish.categoryName;
      lines.push("", currentCategory);
    }
    lines.push(`• ${dish.name}`);
  }

  if (!order.menuDishes.length) lines.push("Menu not selected yet.");
  const hiTeaNotes = normalizeHiTeaNotes(order.hiTeaNotes);
  if (hiTeaNotes) lines.push("", "Hi-tea notes", hiTeaNotes);
  return lines.join("\n");
}

export function menuNotificationChanged(before: NotificationOrder, next: NotificationOrder) {
  return (
    selectedMenuText(before) !== selectedMenuText(next) ||
    before.customerPhone !== next.customerPhone ||
    (before.customer2Phone ?? null) !== (next.customer2Phone ?? null) ||
    (before.customer2Name ?? null) !== (next.customer2Name ?? null)
  );
}

export function selectedMenuTemplateParams(order: NotificationOrder, customName?: string | null): string[] {
  return [
    customName?.trim() || order.customerName?.trim() || "Customer",
    order.date.split("-").reverse().join("/"),
    order.venue,
    order.mealType,
    String(order.numberOfPersons + order.extraPlates),
  ];
}

export type CustomerNotificationDraft = {
  orderId: number; recipientKind: "customer" | "manager"; recipientName: string; phone: string;
  kind: "confirmation" | "menu_update" | "selected_menu";
  payload: { mode: "template"; template: string; params: string[]; document?: { url: string; filename: string } };
};

export function planCustomerNotifications(before: NotificationOrder | null, next: NotificationOrder): CustomerNotificationDraft[] {
  if (before && !menuNotificationChanged(before, next)) return [];
  const drafts: CustomerNotificationDraft[] = [];
  const hasMenu = next.menuDishes.length > 0 || !!normalizeHiTeaNotes(next.hiTeaNotes);

  const phone1 = normalizeWhatsAppHubPhone(next.customerPhone ?? "");
  const phone2 = normalizeWhatsAppHubPhone(next.customer2Phone ?? "");

  // Customer 1
  if (phone1 && phone1 !== BOOKING_MANAGER_PHONE && (!before || hasMenu)) {
    drafts.push({
      orderId: next.id,
      recipientKind: "customer",
      recipientName: next.customerName?.trim() || "Customer",
      phone: next.customerPhone!,
      kind: before ? "menu_update" : "confirmation",
      payload: before
        ? { mode: "template", template: CUSTOMER_MENU_TEMPLATE, params: selectedMenuTemplateParams(next, next.customerName) }
        : { mode: "template", template: "customerorder", params: [next.date.split("-").reverse().join("/"), next.venue, next.mealType] },
    });
  }

  // Customer 2 (if present, not Sunny, and distinct from Customer 1)
  if (phone2 && phone2 !== BOOKING_MANAGER_PHONE && phone2 !== phone1 && (!before || hasMenu)) {
    drafts.push({
      orderId: next.id,
      recipientKind: "customer",
      recipientName: next.customer2Name?.trim() || "Customer 2",
      phone: next.customer2Phone!,
      kind: before ? "menu_update" : "confirmation",
      payload: before
        ? { mode: "template", template: CUSTOMER_MENU_TEMPLATE, params: selectedMenuTemplateParams(next, next.customer2Name || next.customerName) }
        : { mode: "template", template: "customerorder", params: [next.date.split("-").reverse().join("/"), next.venue, next.mealType] },
    });
  }

  // Manager Sunny
  if (hasMenu) {
    drafts.push({
      orderId: next.id,
      recipientKind: "manager",
      recipientName: `Manager ${BOOKING_MANAGER_NAME}`,
      phone: BOOKING_MANAGER_PHONE,
      kind: before ? "menu_update" : "selected_menu",
      payload: { mode: "template", template: CUSTOMER_MENU_TEMPLATE, params: selectedMenuTemplateParams(next, next.customerName) },
    });
  }

  return drafts;
}

export function formatHiTeaMaterialNote(notes: string[]): string {
  const clean = notes
    .map(n => n.trim().replace(/^(?:hi[- ]?tea|high[- ]?tea)\s*[:-]*\s*/i, ""))
    .filter(Boolean);
  if (!clean.length) return "";
  return `HI-TEA:- ${clean.join("; ")}`;
}

export function vendorTemplateParams(order: NotificationOrder, timing: string, items: NotificationMaterial[], names: Map<number, string>, venue: string, updated: boolean) {
  // WhatsApp Hub/Meta strip real newlines in template params and turn them into " | ".
  // One message per vendor: all items combined. Per-item timing/description stay on the line.
  const list = items.map((item, index) => {
    const name = names.get(item.rawMaterialId) || "Kitchen item";
    const description = item.notes?.trim().replace(/\s+/g, " ");
    const itemTiming = item.timing?.trim();
    const timeLabel = itemTiming ? formatEventTime(itemTiming) : null;
    let line = `${index + 1}) ${name}: ${item.unitQty} ${item.unitName}`;
    if (timeLabel) line += ` @ ${timeLabel}`;
    if (description) line += ` (${description})`;
    return line;
  });
  const details = list.join(" · ");

  // {{1}} uses meal/order timing; item-specific times are on each material line.
  // {{4}} keeps the update banner only.
  const notes = updated ? "UPDATED ORDER — replaces previous details" : "—";

  return [vendorScheduleLabel(order.date, timing), venue, details, notes];
}
