"use client";

import { useState, useRef, useTransition } from "react";
import { Plus, IndianRupee, HandCoins, ChevronDown } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

import type { OrderRecord } from "@/app/orders/actions";
import type { OrderPaymentRecord } from "./actions";
import { createOrderPayment, createOrderPaymentExpense } from "./actions";
import { toast } from "sonner";
import { calculateEffectiveTotal } from "@/lib/utils";

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

  const rawOrderAmount = order.totalAmount || 0;
  const totalOrderAmount = calculateEffectiveTotal(order.totalAmount, order.discount) || 0;
  const totalReceived = payments.filter(p => !p.isWaived).reduce((acc, p) => acc + p.amount, 0);
  const totalWaived = payments.filter(p => p.isWaived).reduce((acc, p) => acc + p.amount, 0);
  
  const netBalance = totalOrderAmount - totalReceived - totalWaived;
  const isOverpaid = netBalance < 0;
  const displayBalance = Math.abs(netBalance);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-8 items-start">
      {/* Left Panel: Command Center */}
      <div className="lg:sticky lg:top-8 flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-1">{order.orderId}</h2>
          <p className="text-sm text-muted mb-8">Manage finances and ledger</p>
          
          <div className={`mb-8 rounded-xl py-8 px-4 border shadow-sm text-center ${isOverpaid ? 'bg-indigo-50 border-indigo-200' : 'bg-background border-border'}`}>
            <p className={`text-sm font-semibold uppercase tracking-widest mb-3 ${isOverpaid ? 'text-indigo-700' : 'text-muted'}`}>
              {isOverpaid ? 'Overpaid / Credit' : 'Balance Due'}
            </p>
            <p className={`text-5xl font-extrabold tracking-tight ${isOverpaid ? 'text-indigo-700' : 'text-foreground'}`}>
              ₹{displayBalance}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="rounded-lg bg-background p-4 border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Total</p>
                {order.discount && (
                  <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary uppercase">
                    Discounted
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-foreground">₹{totalOrderAmount}</p>
              {order.discount && (
                <p className="mt-1 text-xs text-muted line-through">₹{rawOrderAmount}</p>
              )}
            </div>
            <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-xs font-medium text-emerald-700 mb-1.5 uppercase tracking-wider">Received</p>
              <p className="text-xl font-bold text-emerald-700">₹{totalReceived}</p>
            </div>
            {totalWaived > 0 && (
              <div className="col-span-2 rounded-lg bg-amber-50 p-4 border border-amber-100">
                <p className="text-xs font-medium text-amber-700 mb-1.5 uppercase tracking-wider">Waived</p>
                <p className="text-xl font-bold text-amber-700">₹{totalWaived}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={openPaymentDialog} 
              className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-5" />
              Record Payment
            </button>
            <button 
              onClick={openWaiveDialog} 
              disabled={netBalance <= 0}
              className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-base font-semibold text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HandCoins className="size-5 text-muted" />
              Waive Amount
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Ledger */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-foreground px-1 lg:mt-2">Payment Ledger</h3>
        
        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center">
            <p className="text-base font-medium text-foreground">No transactions yet</p>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto">Record a payment or waive a portion of the balance to see it here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-background divide-y divide-border shadow-sm">
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} openExpenseDialog={openExpenseDialog} />
            ))}
          </div>
        )}
      </div>

      {/* Add Payment Dialog */}
      <dialog ref={paymentDialogRef} className="app-dialog" onClose={closePaymentDialog}>
        <form action={handleAddPayment} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Record Payment</h2>
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
              {isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </dialog>

      {/* Add Waive Dialog */}
      <dialog ref={waiveDialogRef} className="app-dialog" onClose={closeWaiveDialog}>
        <form action={handleAddWaive} className="flex flex-col">
          <input type="hidden" name="amount" value={netBalance > 0 ? netBalance : 0} />
          <input type="hidden" name="date" value={today} />
          <input type="hidden" name="notes" value="Waived remaining balance" />
          
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Waive Balance?</h2>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to waive the remaining balance of <span className="font-bold text-foreground">₹{netBalance > 0 ? netBalance : 0}</span>? 
              This will settle the order without receiving the cash.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4 bg-surface/50">
            <button type="button" onClick={closeWaiveDialog} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="submit" disabled={isPending || netBalance <= 0} className="inline-flex min-h-10 items-center rounded-lg bg-amber-100 px-4 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {isPending ? "Waiving..." : "Yes, Waive Balance"}
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
    </div>
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
