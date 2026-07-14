"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
import type { OrderWithBalance } from "@/app/payments/actions";
import { addPayment, waiveBalance } from "@/app/payments/actions";
import { StatusBadge, formatCurrency } from "./payment-badges";

export function PaymentManager({ 
  order, 
  onClose 
}: { 
  order: OrderWithBalance;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      setLoading(false);
      return;
    }

    const res = await addPayment({
      orderId: order.id,
      amount: numericAmount,
      date,
      notes
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setAmount("");
      setNotes("");
      onClose();
    }
    setLoading(false);
  };

  const handleWaive = async () => {
    if (!confirm("Are you sure you want to waive the remaining balance?")) return;
    setError("");
    setLoading(true);

    const res = await waiveBalance({
      orderId: order.id,
      date: new Date().toISOString().slice(0, 10),
    });

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-background shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
          <h2 className="text-lg font-semibold text-foreground">
            Manage Payments: {order.orderId}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-lg text-muted hover:text-foreground hover:bg-background transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-surface rounded-xl p-3 border border-border">
              <p className="text-sm text-muted mb-1">Total Amount</p>
              <p className="text-lg font-semibold text-foreground">
                {order.totalAmount !== null ? formatCurrency(order.totalAmount) : "Not Set"}
              </p>
            </div>
            <div className="bg-surface rounded-xl p-3 border border-border">
              <p className="text-sm text-muted mb-1">Balance</p>
              <p className="text-lg font-semibold text-foreground">
                {order.balance !== null ? formatCurrency(order.balance) : "---"}
              </p>
            </div>
            <div className="bg-surface rounded-xl p-3 border border-border">
              <p className="text-sm text-muted mb-1">Total Paid</p>
              <p className="text-lg font-semibold text-emerald-600">
                {formatCurrency(order.totalPaid)}
              </p>
            </div>
            <div className="bg-surface rounded-xl p-3 border border-border flex flex-col justify-center items-start">
              <p className="text-sm text-muted mb-1">Status</p>
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-3">Payment History</h3>
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted italic">No payments recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {p.isWaived ? "Balance Waived" : "Payment Received"}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{p.date}</p>
                      {p.notes && <p className="text-xs text-muted mt-1 italic">"{p.notes}"</p>}
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${p.isWaived ? "text-purple-600" : "text-emerald-600"}`}>
                        {p.isWaived ? "₹0" : formatCurrency(p.amount)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {order.status !== "Cleared" && order.status !== "Waived" && order.totalAmount !== null && (
            <div className="bg-surface rounded-xl p-4 border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">Add Payment</h3>
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Amount</label>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={order.balance ? String(order.balance) : "0"}
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
                    placeholder="e.g. Cash, UPI, Cheque #123"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Record Payment"}
                  </button>
                  <button 
                    type="button"
                    onClick={handleWaive}
                    disabled={loading}
                    className="flex-1 bg-purple-50 text-purple-700 border border-purple-200 font-semibold py-2.5 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                  >
                    Waive Balance
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
