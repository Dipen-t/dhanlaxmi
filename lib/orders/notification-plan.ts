import { groupMaterialsByVendorTiming, vendorScheduleLabel } from "./vendor-timing";

export type NotificationMaterial = { rawMaterialId: number; vendorId?: number | null; timing?: string | null; unitQty: string; unitName: string; notes?: string | null };
export type NotificationOrder = {
  id: number; date: string; venue: string; mealType: string; numberOfPersons: number; extraPlates: number;
  customerName: string | null; customerPhone: string | null;
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
  return lines.join("\n");
}

export function menuNotificationChanged(before: NotificationOrder, next: NotificationOrder) {
  return selectedMenuText(before) !== selectedMenuText(next) || before.customerPhone !== next.customerPhone;
}

export function vendorTemplateParams(order: NotificationOrder, timing: string, items: NotificationMaterial[], names: Map<number, string>, venue: string, updated: boolean) {
  const list = items.map(item => `• ${names.get(item.rawMaterialId) || "Kitchen item"}: ${item.unitQty} ${item.unitName}`).join("  |  ");
  const details = `${updated ? "UPDATED ORDER — replaces previous details. " : ""}Plates: ${order.numberOfPersons + order.extraPlates}  |  ${list}`;
  // The fourth template parameter is High Tea details: only the entered notes belong here.
  const notes = [...new Set(items.flatMap(item => item.notes?.trim() ? [item.notes.trim()] : []))].join("; ") || "—";
  return [vendorScheduleLabel(order.date, timing), venue, details, notes];
}
