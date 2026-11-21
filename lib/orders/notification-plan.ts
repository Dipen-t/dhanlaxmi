import { groupMaterialsByVendorTiming, vendorScheduleLabel } from "./vendor-timing";
import { BOOKING_MANAGER_NAME, BOOKING_MANAGER_PHONE } from "../whatsapp-booking-config";
import { normalizeWhatsAppHubPhone } from "../whatsapp-phone";
import { normalizeHiTeaNotes } from "./hi-tea";

export const CUSTOMER_MENU_TEMPLATE = "customer_menu";

export type NotificationMaterial = { rawMaterialId: number; vendorId?: number | null; timing?: string | null; unitQty: string; unitName: string; notes?: string | null };
export type NotificationOrder = {
  id: number; date: string; venue: string; mealType: string; numberOfPersons: number; extraPlates: number;
  customerName: string | null; customerPhone: string | null;
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
  const updates = newGroups.filter(group => {
    const previous = oldGroups.find(old => old.vendorId === group.vendorId && old.timing === group.timing);
    return !previous || scheduleChanged || materialKey(previous.items) !== materialKey(group.items);
  });
  const removed = oldGroups.flatMap(group => {
    const items = group.items.filter(old => !newGroups.some(current => current.vendorId === group.vendorId && current.timing === group.timing && current.items.some(item => item.rawMaterialId === old.rawMaterialId)));
    return items.length ? [{ ...group, items }] : [];
  });
  return { updates, removed };
}

export function selectedMenuText(order: NotificationOrder) {
  const lines = ["Dhanlaxmi Caterer", `Customer: ${order.customerName || "Customer"}`, `Date: ${order.date.split("-").reverse().join("/")}`, `Venue: ${order.venue}`, `Meal: ${order.mealType}`, `Plates: ${order.numberOfPersons + order.extraPlates}`, "", "Selected menu"];
  let category = "";
  for (const dish of order.menuDishes) {
    if (dish.categoryName !== category) { category = dish.categoryName; lines.push("", category); }
    lines.push(`• ${dish.name}`);
  }
  if (!order.menuDishes.length) lines.push("Menu not selected yet.");
  const hiTeaNotes = normalizeHiTeaNotes(order.hiTeaNotes);
  if (hiTeaNotes) lines.push("", "Hi-tea notes", hiTeaNotes);
  return lines.join("\n");
}

export function menuNotificationChanged(before: NotificationOrder, next: NotificationOrder) {
  return selectedMenuText(before) !== selectedMenuText(next) || before.customerPhone !== next.customerPhone;
}

export function selectedMenuTemplateParams(order: NotificationOrder): string[] {
  const categories = new Map<number, { name: string; dishes: string[] }>();
  for (const dish of order.menuDishes) {
    const group = categories.get(dish.categoryId) ?? { name: dish.categoryName, dishes: [] };
    group.dishes.push(dish.name);
    categories.set(dish.categoryId, group);
  }
  // The gateway's template variables cannot contain raw newlines. Keep every
  // category and dish, using clear inline separators rather than truncating.
  const sections = [...categories.values()].map(category => `${category.name}: ${category.dishes.join(" / ")}`);
  const hiTeaNotes = normalizeHiTeaNotes(order.hiTeaNotes);
  if (hiTeaNotes) sections.push(`Hi-tea notes: ${hiTeaNotes}`);
  const menu = sections.join(" | ");
  return [order.customerName?.trim() || "Customer", order.date.split("-").reverse().join("/"), order.venue, order.mealType, String(order.numberOfPersons + order.extraPlates), menu];
}

export type CustomerNotificationDraft = {
  orderId: number; recipientKind: "customer" | "manager"; recipientName: string; phone: string;
  kind: "confirmation" | "menu_update" | "selected_menu";
  payload: { mode: "template"; template: string; params: string[] };
};

export function planCustomerNotifications(before: NotificationOrder | null, next: NotificationOrder): CustomerNotificationDraft[] {
  if (before && !menuNotificationChanged(before, next)) return [];
  const drafts: CustomerNotificationDraft[] = [];
  const hasMenu = next.menuDishes.length > 0 || !!normalizeHiTeaNotes(next.hiTeaNotes);
  const menuPayload = { mode: "template" as const, template: CUSTOMER_MENU_TEMPLATE, params: selectedMenuTemplateParams(next) };
  if (next.customerPhone && normalizeWhatsAppHubPhone(next.customerPhone) !== BOOKING_MANAGER_PHONE && (!before || hasMenu)) {
    drafts.push({ orderId: next.id, recipientKind: "customer", recipientName: next.customerName || "Customer", phone: next.customerPhone,
      kind: before ? "menu_update" : "confirmation", payload: before ? menuPayload : { mode: "template", template: "customerorder", params: [next.date.split("-").reverse().join("/"), next.venue, next.mealType] } });
  }
  if (hasMenu) drafts.push({ orderId: next.id, recipientKind: "manager", recipientName: `Manager ${BOOKING_MANAGER_NAME}`, phone: BOOKING_MANAGER_PHONE,
    kind: before ? "menu_update" : "selected_menu", payload: menuPayload });
  return drafts;
}

export function vendorTemplateParams(order: NotificationOrder, timing: string, items: NotificationMaterial[], names: Map<number, string>, venue: string, updated: boolean) {
  // WhatsApp Hub/Meta strip real newlines in template params and turn them into " | ".
  // Keep this param readable as one line: plates first, then numbered items.
  const plates = `Plates: ${order.numberOfPersons + order.extraPlates}`;
  const list = items.map((item, index) => {
    const name = names.get(item.rawMaterialId) || "Kitchen item";
    return `${index + 1}) ${name}: ${item.unitQty} ${item.unitName}`;
  });
  const details = [plates, ...list].join(" · ");

  // Put the update banner in {{4}} so {{3}} stays a clean materials list.
  const noteParts: string[] = [];
  if (updated) noteParts.push("UPDATED ORDER");
  const itemNotes = [...new Set(items.flatMap((item) => (item.notes?.trim() ? [item.notes.trim()] : [])))];
  if (itemNotes.length) noteParts.push(itemNotes.join("; "));
  const notes = noteParts.join(" · ") || "—";

  return [vendorScheduleLabel(order.date, timing), venue, details, notes];
}
