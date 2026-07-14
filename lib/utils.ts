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
