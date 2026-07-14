"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import type { OrderWithVendorPayments, OrderVendorRecord } from "@/app/payments-out/actions";
import { addVendorPayment } from "@/app/payments-out/actions";
import { formatCurrency } from "@/components/payments/payment-badges";

export function VendorPaymentManager({ 
  order, 
  onClose 
}: { 
  order: OrderWithVendorPayments;
  onClose: () => void;
}) {
  const [selectedVendorId, setSelectedVendorId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedVendor = order.vendors.find(v => v.vendorId === selectedVendorId);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (selectedVendorId === "") {
      setError("Please select a vendor.");
      setLoading(false);
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      setLoading(false);
      return;
    }

    const res = await addVendorPayment({
      orderId: order.id,
      vendorId: Number(selectedVendorId),
      amount: numericAmount,
      date,
      notes
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setAmount("");
      setNotes("");
      // Don't close so they can see it added, or maybe close. Let's just reset form.
      // The parent will re-render because we called revalidatePath in the action.
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-background shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Payments Out: {order.orderId}
            </h2>
            <p className="text-sm text-muted">Total Paid Out: {formatCurrency(order.totalPaidOut)}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
          
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-3">Record New Payment</h3>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Select Vendor</label>
                <div className="relative">
                  <select
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none pr-10"
                  >
                    <option value="" disabled>-- Select Vendor --</option>
                    {order.vendors.map(v => (
                      <option key={v.vendorId} value={v.vendorId}>
                        {v.vendorName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes (Optional)</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Advance payment"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {selectedVendor ? `History: ${selectedVendor.vendorName}` : "Vendor Payment History"}
            </h3>
            
            {!selectedVendor ? (
              <p className="text-sm text-muted italic">Select a vendor to view their payment history for this order.</p>
            ) : selectedVendor.payments.length === 0 ? (
              <div className="bg-surface rounded-xl p-4 text-center border border-border">
                <p className="text-sm text-muted italic">No payments recorded yet.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {selectedVendor.payments.map((p) => (
                  <li key={p.id} className="flex flex-col border border-border rounded-lg p-3 bg-surface">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-muted">{p.date}</p>
                    </div>
                    {p.notes && <p className="text-xs text-muted mt-1 italic">"{p.notes}"</p>}
                  </li>
                ))}
              </ul>
            )}

            {selectedVendor && selectedVendor.totalPaid > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between">
                <span className="text-sm font-medium text-emerald-800">Total Paid:</span>
                <span className="text-sm font-bold text-emerald-800">{formatCurrency(selectedVendor.totalPaid)}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
