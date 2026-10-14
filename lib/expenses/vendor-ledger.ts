type Vendor = { id: number; name: string };
export type VendorPayment = {
  id: number; vendorId: number; vendorName: string; amount: number; date: string; notes: string | null;
};

export function buildVendorLedger(linkedVendors: Vendor[], payments: VendorPayment[]) {
  const ledger = new Map<number, Vendor & { totalPaid: number; payments: VendorPayment[] }>();
  for (const vendor of linkedVendors) {
    if (!ledger.has(vendor.id)) ledger.set(vendor.id, { ...vendor, totalPaid: 0, payments: [] });
  }
  for (const payment of payments) {
    if (!ledger.has(payment.vendorId)) {
      ledger.set(payment.vendorId, { id: payment.vendorId, name: payment.vendorName, totalPaid: 0, payments: [] });
    }
    const vendor = ledger.get(payment.vendorId)!;
    vendor.totalPaid += payment.amount;
    vendor.payments.push(payment);
  }
  return [...ledger.values()].sort((a, b) => a.name.localeCompare(b.name));
}
