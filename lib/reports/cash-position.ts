type Receipt = {
  amount: number;
  isWaived: boolean;
  expenses: { amount: number }[];
};

// Profit for now uses money received, not the unpaid portion of the bill.
export function calculateCashPosition(receipts: Receipt[], vendorPayments: { amount: number }[]) {
  const clientPaid = receipts.filter(p => !p.isWaived).reduce((sum, p) => sum + p.amount, 0);
  const clientWaived = receipts.filter(p => p.isWaived).reduce((sum, p) => sum + p.amount, 0);
  const otherExpenses = receipts.reduce((sum, p) => sum + p.expenses.reduce((total, e) => total + e.amount, 0), 0);
  const vendorExpenses = vendorPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = otherExpenses + vendorExpenses;
  return { clientPaid, clientWaived, otherExpenses, vendorExpenses, totalExpenses, netProfit: clientPaid - totalExpenses };
}
