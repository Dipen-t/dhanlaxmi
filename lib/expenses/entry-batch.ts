type VendorExpenseEntry = { vendorId: number; amount: number };
type OtherExpenseEntry = { description: string; amount: number };
type BatchResult<T> = { entries: T[]; error?: never } | { error: string; entries?: never };

function validAmount(value: number) {
  return Number.isInteger(value) && value > 0 && value <= 2147483647;
}

export function parseVendorExpenseEntries(data: FormData): BatchResult<VendorExpenseEntry> {
  const vendorIds = data.getAll("vendorId");
  const amounts = data.getAll("amount");
  if (vendorIds.length !== amounts.length) return { error: "The vendor rows are incomplete. Reload the form and try again." };
  const entries: VendorExpenseEntry[] = [];
  const seen = new Set<number>();
  for (let index = 0; index < vendorIds.length; index++) {
    const value = String(amounts[index]).trim();
    if (!value) continue;
    const vendorId = Number(vendorIds[index]);
    const amount = Number(value);
    if (!Number.isSafeInteger(vendorId) || vendorId <= 0 || seen.has(vendorId)) {
      return { error: "A vendor row is invalid or repeated. Reload the form and try again." };
    }
    if (!validAmount(amount)) return { error: "Enter a positive whole-rupee amount for each filled vendor row." };
    seen.add(vendorId);
    entries.push({ vendorId, amount });
  }
  return entries.length ? { entries } : { error: "Enter an amount for at least one vendor." };
}

export function parseOtherExpenseEntries(data: FormData): BatchResult<OtherExpenseEntry> {
  const descriptions = data.getAll("description");
  const amounts = data.getAll("amount");
  if (descriptions.length !== amounts.length) return { error: "The expense rows are incomplete. Reload the form and try again." };
  const entries: OtherExpenseEntry[] = [];
  for (let index = 0; index < descriptions.length; index++) {
    const description = String(descriptions[index]).trim();
    const value = String(amounts[index]).trim();
    if (!description && !value) continue;
    if (!description || description.length > 240) {
      return { error: `Enter a description of up to 240 characters for expense ${index + 1}.` };
    }
    const amount = Number(value);
    if (!validAmount(amount)) return { error: `Enter a positive whole-rupee amount for expense ${index + 1}.` };
    entries.push({ description, amount });
  }
  return entries.length ? { entries } : { error: "Add at least one expense with a description and amount." };
}
