type Receipt = {
  amount: number;
  isWaived: boolean;
};

/** Cash remaining = client received − vendor paid − other expenses (order-level pool). */
export function calculateCashPosition(
  receipts: Receipt[],
  vendorPayments: { amount: number }[],
  otherExpenses: { amount: number }[] = [],
) {
  const clientPaid = receipts.filter((p) => !p.isWaived).reduce((sum, p) => sum + p.amount, 0);
  const clientWaived = receipts.filter((p) => p.isWaived).reduce((sum, p) => sum + p.amount, 0);
  const otherTotal = otherExpenses.reduce((sum, e) => sum + e.amount, 0);
  const vendorExpenses = vendorPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = otherTotal + vendorExpenses;
  return {
    clientPaid,
    clientWaived,
    otherExpenses: otherTotal,
    vendorExpenses,
    totalExpenses,
    netProfit: clientPaid - totalExpenses,
  };
}
