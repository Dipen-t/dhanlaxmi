export function isHiTeaCategory(name: string): boolean {
  return /\bhi(?:gh)?\s*tea\b/i.test(name.replace(/[^a-z0-9]+/gi, " "));
}

export const HI_TEA_NOTES_LIMIT = 2000;

export function normalizeHiTeaNotes(value: string | null | undefined): string {
  return (value ?? "").trim();
}
