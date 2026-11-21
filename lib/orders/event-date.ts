// Booking days belong to the catering business calendar, not the host timezone.
// IST also restores legacy values saved as 18:30 UTC on the preceding day.
export function eventDateString(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function parseEventDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}
