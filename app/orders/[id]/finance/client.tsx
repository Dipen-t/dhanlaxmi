"use client";

import { useState, useRef, useTransition } from "react";
import { Plus, IndianRupee, HandCoins } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

import type { OrderRecord } from "@/app/orders/actions";
import type { OrderPaymentRecord } from "./actions";
import { createOrderPayment, createOrderPaymentExpense } from "./actions";
import { FloatingAddButton } from "@/components/floating-add-button";
import { toast } from "sonner";

type OrderFinanceClientProps = {
  order: OrderRecord;
  payments: OrderPaymentRecord[];
};

export function OrderFinanceClient({ order, payments }: OrderFinanceClientProps) {
  const [isPending, startTransition] = useTransition();
  const paymentDialogRef = useRef<HTMLDialogElement>(null);
  const expenseDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  function openPaymentDialog() {
    paymentDialogRef.current?.showModal();
  }

  function closePaymentDialog() {
    paymentDialogRef.current?.close();
  }

  function openExpenseDialog(paymentId: number) {
    setSelectedPaymentId(paymentId);
    expenseDialogRef.current?.showModal();
  }

  function closeExpenseDialog() {
    expenseDialogRef.current?.close();
    setSelectedPaymentId(null);
  }

  async function handleAddPayment(formData: FormData) {
    formData.append("orderId", String(order.id));
    startTransition(async () => {
      const res = await createOrderPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment added");
        closePaymentDialog();
      }
    });
  }

  async function handleAddExpense(formData: FormData) {
    if (!selectedPaymentId) return;
    formData.append("orderId", String(order.id));
    formData.append("orderPaymentId", String(selectedPaymentId));
    
    startTransition(async () => {
      const res = await createOrderPaymentExpense(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Expense added");
        closeExpenseDialog();
      }
    });
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">{order.orderId} Finances</h2>
        <p className="text-sm text-muted">Manage payments and expenses for this order.</p>
        <div className="mt-4 flex gap-4">
          <div className="flex-1 rounded-lg bg-background p-4 border border-border">
            <p className="text-sm text-muted">Total Order Amount</p>
            <p className="text-2xl font-bold text-foreground">₹{order.totalAmount || 0}</p>
          </div>
          <div className="flex-1 rounded-lg bg-primary-soft p-4 border border-primary/20">
            <p className="text-sm text-primary">Total Received</p>
            <p className="text-2xl font-bold text-primary">
              ₹{payments.reduce((acc, p) => acc + p.amount, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Payments In</h3>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-base font-medium text-foreground">No payments yet</p>
            <p className="mt-1 text-sm text-muted">Add a payment received for this order.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-border bg-background p-4 sm:p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <IndianRupee className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground text-lg">₹{payment.amount}</p>
                        <p className="text-sm text-muted">{dateFormatter.format(new Date(payment.date))}</p>
                      </div>
                    </div>
                    {payment.notes && <p className="mt-2 text-sm text-muted text-pretty">{payment.notes}</p>}
                    {payment.isWaived && <span className="mt-2 inline-block rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Waived</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => openExpenseDialog(payment.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    <Plus className="size-4" />
                    Expense
                  </button>
                </div>

                {payment.expenses && payment.expenses.length > 0 && (
                  <div className="mt-4 rounded-lg bg-surface/50 p-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase text-muted">Expenses</h4>
                    <ul className="space-y-2">
                      {payment.expenses.map((expense) => (
                        <li key={expense.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-foreground">{expense.description}</p>
                            <p className="text-xs text-muted">{dateFormatter.format(new Date(expense.date))}</p>
                          </div>
                          <span className="font-semibold text-error">-₹{expense.amount}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingAddButton onClick={openPaymentDialog} label="Add Payment" />

      {/* Add Payment Dialog */}
      <dialog ref={paymentDialogRef} className="app-dialog" onClose={closePaymentDialog}>
        <form action={handleAddPayment} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add Payment In</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Amount (₹) *</span>
                <input required type="number" name="amount" min="1" step="1" className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Date *</span>
                <input required type="date" name="date" defaultValue={today} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isWaived" value="true" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-foreground">Payment is Waived</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Notes</span>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"></textarea>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4 bg-surface/50">
            <button type="button" onClick={closePaymentDialog} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {isPending ? "Adding..." : "Add Payment"}
            </button>
          </div>
        </form>
      </dialog>

      {/* Add Expense Dialog */}
      <dialog ref={expenseDialogRef} className="app-dialog" onClose={closeExpenseDialog}>
        <form action={handleAddExpense} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add Expense</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Description *</span>
                <input required type="text" name="description" placeholder="e.g. Transport, Helper" className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Amount (₹) *</span>
                <input required type="number" name="amount" min="1" step="1" className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Date *</span>
                <input required type="date" name="date" defaultValue={today} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4 bg-surface/50">
            <button type="button" onClick={closeExpenseDialog} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex min-h-10 items-center rounded-lg border border-error/20 bg-error-soft px-4 text-sm font-medium text-error transition-colors hover:bg-error/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {isPending ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
