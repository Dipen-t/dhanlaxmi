export const APP_TIME_ZONE = "Asia/Kolkata";

/** Calendar date YYYY-MM-DD in the app business timezone. */
export function todayInAppTz(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseYmd(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

/** Inclusive: access is allowed on the expiry date itself. */
export function isPastExpiry(expiresOn: string | null, today = todayInAppTz()): boolean {
  if (!expiresOn) return false;
  const parsed = parseYmd(expiresOn);
  if (!parsed) return false;
  return today > expiresOn.trim();
}

export function daysRemaining(expiresOn: string | null, today = todayInAppTz()): number | null {
  if (!expiresOn) return null;
  const end = parseYmd(expiresOn);
  const start = parseYmd(today);
  if (!end || !start) return null;

  const endUtc = Date.UTC(end.y, end.m - 1, end.d);
  const startUtc = Date.UTC(start.y, start.m - 1, start.d);
  return Math.floor((endUtc - startUtc) / 86_400_000);
}

export function normalizeExpiresOn(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!parseYmd(trimmed)) {
    throw new Error("Expiry must be a valid date (YYYY-MM-DD).");
  }
  return trimmed;
}
