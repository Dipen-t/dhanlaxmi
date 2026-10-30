const POSTGRES_INTEGER_MAX = 2_147_483_647;

export function calculatePlateTotal(plates: number, perPlateAmount: number) {
  if (!Number.isInteger(plates) || plates < 1 || plates > 100_000) {
    return null;
  }

  if (
    !Number.isInteger(perPlateAmount) ||
    perPlateAmount < 1 ||
    perPlateAmount > POSTGRES_INTEGER_MAX
  ) {
    return null;
  }

  const total = plates * perPlateAmount;
  return Number.isSafeInteger(total) && total <= POSTGRES_INTEGER_MAX
    ? total
    : null;
}

export function calculateTotalWithExtraPlates(
  originalPlates: number,
  extraPlates: number,
  perPlateAmount: number,
) {
  if (!Number.isInteger(extraPlates) || extraPlates < 0) return null;
  return calculatePlateTotal(originalPlates + extraPlates, perPlateAmount);
}
