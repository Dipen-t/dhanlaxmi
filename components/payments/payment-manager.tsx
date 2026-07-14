"use client";

import { useState } from "react";
import { Trash2, X, Check } from "lucide-react";
import type { OrderWithBalance } from "@/app/payments/actions";
import { addPayment, waiveBalance, deletePayment } from "@/app/payments/actions";
import { StatusBadge, formatCurrency } from "./payment-badges";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

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

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isDestructive: false,
    onConfirm: () => {},
  });

  const closeDialog = () => setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

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
      toast.error(res.error);
      setError(res.error);
    } else {
      toast.success("Payment recorded successfully!");
      setAmount("");
      setNotes("");
      onClose();
    }
    setLoading(false);
  };

  const handleWaive = async () => {
    const numericAmount = Number(amount);
    const waiveAmount = numericAmount > 0 ? numericAmount : (order.balance || 0);

    if (waiveAmount <= 0) {
      setError("No balance to waive or invalid amount entered.");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Waive Balance",
      message: `Are you sure you want to waive ${formatCurrency(waiveAmount)}? This will record the waived amount and adjust the balance.`,
      isDestructive: true,
      onConfirm: async () => {
        closeDialog();
        setError("");
        setLoading(true);

        const res = await waiveBalance({
          orderId: order.id,
          amount: waiveAmount,
          date: new Date().toISOString().slice(0, 10),
        });

        if (res?.error) {
          toast.error(res.error);
          setError(res.error);
        } else {
          toast.success(`Successfully waived ${formatCurrency(waiveAmount)}!`);
          onClose();
        }
        setLoading(false);
      }
    });
  };

  const handleDelete = (paymentId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Payment",
      message: "Are you sure you want to delete this payment? This action cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        closeDialog();
        setError("");
        setLoading(true);

        const res = await deletePayment(paymentId);

        if (res?.error) {
          toast.error(res.error);
          setError(res.error);
        } else {
          toast.success("Payment deleted successfully.");
        }
        setLoading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-background shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
          
          <div className="flex-1 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-xl p-3 border border-border">
                <p className="text-sm text-muted mb-1">
                  Total Amount
                  {order.discount && <span className="ml-1 text-emerald-600 text-xs font-semibold">(-{order.discount})</span>}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {order.effectiveTotal !== null ? formatCurrency(order.effectiveTotal) : "Not Set"}
                </p>
                {order.discount && order.totalAmount && (
                  <p className="text-xs text-muted line-through mt-0.5">{formatCurrency(order.totalAmount)}</p>
                )}
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
                      placeholder="e.g. Google Pay, Cash"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Record Payment"}
                    </button>
                    {order.balance !== null && order.balance > 0 && (
                      <button
                        type="button"
                        onClick={handleWaive}
                        disabled={loading}
                        className="px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Waive Balance
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="flex-1 border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Payment History</h3>
            {order.payments.length === 0 ? (
              <div className="bg-surface rounded-xl p-4 text-center border border-border">
                <p className="text-sm text-muted italic">No payments recorded yet.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-col border border-border rounded-lg p-3 bg-surface group">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {p.isWaived ? "Balance Waived" : "Payment Received"}
                        </p>
                        <p className="text-xs text-muted mt-0.5">{p.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-semibold ${p.isWaived ? "text-purple-600" : "text-emerald-600"}`}>
                          {p.isWaived ? "₹0" : formatCurrency(p.amount)}
                        </p>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={loading}
                          className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          title="Delete payment"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    {p.notes && <p className="text-xs text-muted mt-1 italic">"{p.notes}"</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
}
