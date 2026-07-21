"use client";

import { useState, useRef, useTransition } from "react";
import { Plus, IndianRupee, HandCoins, ChevronDown } from "lucide-react";

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
  const waiveDialogRef = useRef<HTMLDialogElement>(null);
  const expenseDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  function openPaymentDialog() {
    paymentDialogRef.current?.showModal();
  }

  function closePaymentDialog() {
    paymentDialogRef.current?.close();
  }

  function openWaiveDialog() {
    waiveDialogRef.current?.showModal();
  }

  function closeWaiveDialog() {
    waiveDialogRef.current?.close();
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

  async function handleAddWaive(formData: FormData) {
    formData.append("orderId", String(order.id));
    formData.append("isWaived", "true");
    startTransition(async () => {
      const res = await createOrderPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Amount waived");
        closeWaiveDialog();
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

  const totalOrderAmount = order.totalAmount || 0;
  const totalReceived = payments.filter(p => !p.isWaived).reduce((acc, p) => acc + p.amount, 0);
  const totalWaived = payments.filter(p => p.isWaived).reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = Math.max(0, totalOrderAmount - totalReceived - totalWaived);

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">{order.orderId} Finances</h2>
        <p className="text-sm text-muted">Manage payments, waive amounts, and expenses for this order.</p>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-background p-4 border border-border shadow-sm">
            <p className="text-sm font-medium text-muted">Total Amount</p>
            <p className="mt-1 text-2xl font-bold text-foreground">₹{totalOrderAmount}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100 shadow-sm">
            <p className="text-sm font-medium text-emerald-700">Received</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">₹{totalReceived}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 border border-amber-100 shadow-sm">
            <p className="text-sm font-medium text-amber-700">Waived</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">₹{totalWaived}</p>
          </div>
          <div className="rounded-lg bg-background p-4 border border-border shadow-sm">
            <p className="text-sm font-medium text-muted">Balance Due</p>
            <p className="mt-1 text-2xl font-bold text-foreground">₹{balanceDue}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Payment History</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={openWaiveDialog} 
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              <HandCoins className="size-4" />
              Waive Amount
            </button>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-base font-medium text-foreground">No payments yet</p>
            <p className="mt-1 text-sm text-muted">Add a payment received for this order.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-background divide-y divide-border shadow-sm">
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} openExpenseDialog={openExpenseDialog} />
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

      {/* Add Waive Dialog */}
      <dialog ref={waiveDialogRef} className="app-dialog" onClose={closeWaiveDialog}>
        <form action={handleAddWaive} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Waive Amount</h2>
            <p className="text-sm text-muted mb-4">Record a discount or waived balance. This will not count as cash received, but will reduce the balance due.</p>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Amount (₹) *</span>
                <input required type="number" name="amount" min="1" step="1" max={balanceDue > 0 ? balanceDue : undefined} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Date *</span>
                <input required type="date" name="date" defaultValue={today} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Reason / Notes</span>
                <textarea name="notes" rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"></textarea>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4 bg-surface/50">
            <button type="button" onClick={closeWaiveDialog} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex min-h-10 items-center rounded-lg bg-amber-100 px-4 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {isPending ? "Waiving..." : "Waive Amount"}
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

function PaymentRow({ payment, openExpenseDialog }: { payment: OrderPaymentRecord, openExpenseDialog: (id: number) => void }) {
  const hasExpenses = payment.expenses && payment.expenses.length > 0;
  
  const content = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${payment.isWaived ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {payment.isWaived ? <HandCoins className="size-4" /> : <IndianRupee className="size-4" />}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-base">₹{payment.amount}</p>
            {payment.isWaived && <span className="inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Waived</span>}
          </div>
          <p className="text-sm text-muted">{dateFormatter.format(new Date(payment.date))}</p>
          {payment.notes && <p className="mt-1 text-sm text-muted max-w-prose text-pretty">{payment.notes}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!payment.isWaived && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); openExpenseDialog(payment.id); }}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            <Plus className="size-4" />
            Add Expense
          </button>
        )}
        {hasExpenses && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface">
            <ChevronDown className="size-5 text-muted transition-transform duration-200 group-open:-rotate-180" />
          </div>
        )}
      </div>
    </div>
  );

  if (hasExpenses) {
    return (
      <details className="group [&_summary::-webkit-details-marker]:hidden">
        <summary className="list-none cursor-pointer focus-visible:outline-none focus-visible:bg-surface/50 transition-colors">
          {content}
        </summary>
        <div className="border-t border-border/50 bg-surface/30 p-4 sm:px-5 sm:pb-5">
           <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Expenses against this payment</h4>
           <ul className="space-y-3">
             {payment.expenses!.map((expense) => (
               <li key={expense.id} className="flex justify-between items-start text-sm">
                 <div>
                   <p className="font-medium text-foreground">{expense.description}</p>
                   <p className="text-xs text-muted">{dateFormatter.format(new Date(expense.date))}</p>
                 </div>
                 <span className="font-semibold text-error">-₹{expense.amount}</span>
               </li>
             ))}
           </ul>
        </div>
      </details>
    );
  }

  return <div>{content}</div>;
}
