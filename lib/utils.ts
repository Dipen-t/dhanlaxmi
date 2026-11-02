/**
 * Format a Date as YYYY-MM-DD using local calendar parts.
 * Never use `toISOString().slice(0, 10)` for event dates — that shifts the day
 * in timezones ahead of UTC (e.g. IST turns Nov 2 00:00 into Nov 1).
 */
export function toCalendarDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse YYYY-MM-DD as local midnight (not UTC). */
export function parseCalendarDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function todayCalendarDateString(): string {
  return toCalendarDateString(new Date());
}

export function formatDateDisplay(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";

  if (typeof dateStr === "string") {
    const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }

  const d = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function calculateEffectiveTotal(total: number | null, discount: string | null): number | null {
  if (total === null) return null;
  if (!discount) return total;
  
  const d = discount.trim();
  if (d.endsWith("%")) {
    const percentage = parseFloat(d.slice(0, -1));
    if (!isNaN(percentage)) {
      return total - (total * (percentage / 100));
    }
  } else {
    // try parse as number, removing any non-digit chars if needed (like 'Rs', etc)
    const numericStr = d.replace(/[^\d.]/g, '');
    const amount = parseFloat(numericStr);
    if (!isNaN(amount)) {
      return total - amount;
    }
  }
  return total;
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
