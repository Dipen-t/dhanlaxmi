import { formatEventTime } from "./event-time";

export function vendorScheduleLabel(date: string, timing: string) {
  return `${date.split("-").reverse().join("/")} at ${formatEventTime(timing)}`;
}

export function groupMaterialsByVendorTiming<T extends { vendorId?: number | null; timing?: string | null }>(materials: T[], mealType: string) {
  const groups = new Map<string, { vendorId: number; timing: string; items: T[] }>();
  for (const item of materials) {
    if (!item.vendorId) continue;
    const timing = item.timing?.trim() || mealType;
    const key = `${item.vendorId}:${timing}`;
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { vendorId: item.vendorId, timing, items: [item] });
  }
  return [...groups.values()];
}
