import { formatEventTime } from "./event-time";

export function vendorScheduleLabel(date: string, timing: string) {
  return `${date.split("-").reverse().join("/")} at ${formatEventTime(timing)}`;
}

/** One WhatsApp group per vendor — all their items combined, regardless of timing. */
export function groupMaterialsByVendorTiming<T extends { vendorId?: number | null; timing?: string | null }>(
  materials: T[],
  mealType: string,
) {
  const groups = new Map<number, { vendorId: number; timing: string; items: T[] }>();
  for (const item of materials) {
    if (!item.vendorId) continue;
    const group = groups.get(item.vendorId);
    if (group) group.items.push(item);
    else groups.set(item.vendorId, { vendorId: item.vendorId, timing: mealType, items: [item] });
  }
  return [...groups.values()];
}
