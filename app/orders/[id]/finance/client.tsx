"use client";

import { useState, useRef, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { listReturnTo } from "@/lib/navigation";
import { Plus, IndianRupee, HandCoins, Pencil, Trash2 } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

import type { OrderRecord } from "@/app/orders/actions";
import type { OrderPaymentRecord } from "./actions";
import { createOrderPayment, updateOrderPayment, deleteOrderPayment } from "./actions";
import { toast } from "sonner";
import { calculateEffectiveTotal, todayCalendarDateString } from "@/lib/utils";

function displayPaymentDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

type OrderFinanceClientProps = {
  order: OrderRecord;
  payments: OrderPaymentRecord[];
};

export function OrderFinanceClient({ order, payments }: OrderFinanceClientProps) {
  const params = useSearchParams();
  const returnTo = listReturnTo(params.get("returnTo"), "/orders");
  const [isPending, startTransition] = useTransition();
  const savingRef = useRef(false);
  const [formVersion, setFormVersion] = useState(0);
  const paymentDialogRef = useRef<HTMLDialogElement>(null);
  const waiveDialogRef = useRef<HTMLDialogElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [editingPayment, setEditingPayment] = useState<OrderPaymentRecord | null>(null);

  function runMutation(work: () => Promise<void>) {
    if (savingRef.current) return;
    savingRef.current = true;
    startTransition(async () => {
      try { await work(); }
      catch { toast.error("Could not confirm the change. Refresh this ledger before trying again."); }
      finally { savingRef.current = false; }
    });
  }

  function openPaymentDialog() {
    setFormVersion(version => version + 1);
    paymentDialogRef.current?.showModal();
  }

  function closePaymentDialog() {
    paymentDialogRef.current?.close();
  }

  function openWaiveDialog() {
    setFormVersion(version => version + 1);
    waiveDialogRef.current?.showModal();
  }

  function closeWaiveDialog() {
    waiveDialogRef.current?.close();
  }

  function openEditDialog(payment: OrderPaymentRecord) {
    setFormVersion(version => version + 1);
    setEditingPayment(payment);
    editDialogRef.current?.showModal();
  }

  function closeEditDialog() {
    editDialogRef.current?.close();
    setEditingPayment(null);
  }

  function openDeleteDialog(payment: OrderPaymentRecord) {
    setFormVersion(version => version + 1);
    setEditingPayment(payment);
    deleteDialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    deleteDialogRef.current?.close();
    setEditingPayment(null);
  }

  async function handleAddPayment(formData: FormData) {
    formData.append("orderId", String(order.id));
    runMutation(async () => {
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
    runMutation(async () => {
      const res = await createOrderPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Amount waived");
        closeWaiveDialog();
      }
    });
  }

  async function handleEditPayment(formData: FormData) {
    if (!editingPayment) return;
    formData.append("orderId", String(order.id));
    formData.append("id", String(editingPayment.id));
    runMutation(async () => {
      const res = await updateOrderPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment updated");
        closeEditDialog();
      }
    });
  }

  async function handleDeletePayment(formData: FormData) {
    if (!editingPayment) return;
    formData.append("orderId", String(order.id));
    formData.append("id", String(editingPayment.id));
    runMutation(async () => {
      const res = await deleteOrderPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment deleted");
        closeDeleteDialog();
      }
    });
  }

  const today = todayCalendarDateString();

  const rawOrderAmount = order.totalAmount || 0;
  const totalOrderAmount = calculateEffectiveTotal(order.totalAmount, order.discount) || 0;
  const totalReceived = payments.filter(p => !p.isWaived).reduce((acc, p) => acc + p.amount, 0);
  const totalWaived = payments.filter(p => p.isWaived).reduce((acc, p) => acc + p.amount, 0);
  
  const netBalance = totalOrderAmount - totalReceived - totalWaived;
  const isOverpaid = netBalance < 0;
  const displayBalance = Math.abs(netBalance);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-8 items-start">
      <div className="lg:sticky lg:top-8 flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-1">{order.orderId}</h2>
          <p className="text-sm text-muted mb-8">Manage finances and ledger</p>
          
          <div className="mb-8 rounded-xl py-8 px-4 border border-border shadow-sm text-center bg-background">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-muted">
              {isOverpaid ? 'Overpaid / Credit' : 'Balance Due'}
            </p>
            <p className="text-5xl font-extrabold tracking-tight text-foreground">
              ₹{displayBalance}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="rounded-lg bg-background p-4 border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-xs font-medium text-muted uppercase tracking-wider">Total</p>
                {order.discount && (
                  <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary uppercase">
                    Discounted
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-foreground">₹{totalOrderAmount}</p>
              {order.discount && (
                <p className="mt-1 text-xs text-muted line-through">₹{rawOrderAmount}</p>
              )}
            </div>
            <div className="rounded-lg bg-background p-4 border border-border">
              <p className="text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Received</p>
              <p className="text-xl font-bold text-foreground">₹{totalReceived}</p>
            </div>
            {totalWaived > 0 && (
              <div className="col-span-2 rounded-lg bg-background p-4 border border-border">
                <p className="text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Waived</p>
                <p className="text-xl font-bold text-foreground">₹{totalWaived}</p>
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

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 lg:mt-2">
          <h3 className="text-lg font-bold text-foreground">Payment Ledger</h3>
          <div className="flex flex-wrap gap-2">
            <Link href={`/orders/${order.id}/edit?returnTo=${encodeURIComponent(returnTo)}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Edit order</Link>
            <Link href={`/expenses?orderId=${order.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Add expenses</Link>
          </div>
        </div>
        
        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center">
            <p className="text-base font-medium text-foreground">No transactions yet</p>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto">Record a payment or waive a portion of the balance to see it here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-background divide-y divide-border shadow-sm">
            {payments.map((payment) => (
              <PaymentRow 
                key={payment.id} 
                payment={payment}
                openEditDialog={openEditDialog}
                openDeleteDialog={openDeleteDialog}
              />
            ))}
          </div>
        )}
      </div>

      <dialog ref={paymentDialogRef} className="app-dialog" onClose={closePaymentDialog} onCancel={event => { if (savingRef.current) event.preventDefault(); }}>
        <form key={formVersion} onSubmit={event => { event.preventDefault(); handleAddPayment(new FormData(event.currentTarget)); }} inert={isPending} aria-busy={isPending} className="flex flex-col">
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

      <dialog ref={waiveDialogRef} className="app-dialog" onClose={closeWaiveDialog} onCancel={event => { if (savingRef.current) event.preventDefault(); }}>
        <form key={formVersion} onSubmit={event => { event.preventDefault(); handleAddWaive(new FormData(event.currentTarget)); }} inert={isPending} aria-busy={isPending} className="flex flex-col">
          <input type="hidden" name="date" value={today} />
          <input type="hidden" name="notes" value="Waived remaining balance" />
          
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Waive Balance</h2>
            <p className="text-sm text-muted mb-6">
              Record a waived amount to settle the order without receiving the cash.
            </p>
            <div className="flex flex-col gap-1.5 mb-2">
              <label className="text-sm font-medium text-foreground">Amount to waive</label>
              <input 
                required 
                type="number" 
                name="amount" 
                min="1" 
                step="1" 
                max={netBalance > 0 ? netBalance : 1}
                defaultValue={netBalance > 0 ? netBalance : ""}
                className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4 bg-surface/50">
            <button type="button" onClick={closeWaiveDialog} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="submit" disabled={isPending || netBalance <= 0} className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {isPending ? "Waiving..." : "Waive Amount"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={editDialogRef} className="app-dialog" onClose={closeEditDialog} onCancel={event => { if (savingRef.current) event.preventDefault(); }}>
        <form key={formVersion} onSubmit={event => { event.preventDefault(); handleEditPayment(new FormData(event.currentTarget)); }} inert={isPending} aria-busy={isPending} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Edit {editingPayment?.isWaived ? "Waived Amount" : "Payment"}</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Amount (₹) *</span>
                <input required type="number" name="amount" min="1" step="1" defaultValue={editingPayment?.amount} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Date *</span>
                <input required type="date" name="date" defaultValue={editingPayment?.date} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Notes</span>
                <textarea name="notes" rows={2} defaultValue={editingPayment?.notes || ""} className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"></textarea>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4 bg-surface/50">
            <button type="button" onClick={closeEditDialog} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={deleteDialogRef} className="app-dialog" onClose={closeDeleteDialog} onCancel={event => { if (savingRef.current) event.preventDefault(); }}>
        <form key={formVersion} onSubmit={event => { event.preventDefault(); handleDeletePayment(new FormData(event.currentTarget)); }} inert={isPending} aria-busy={isPending} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Delete {editingPayment?.isWaived ? "Waived Amount" : "Payment"}?</h2>
            <p className="text-sm text-muted">
              Are you sure you want to delete this {editingPayment?.isWaived ? "waived amount" : "payment"} of <span className="font-bold text-foreground">₹{editingPayment?.amount}</span>? This action cannot be undone and will affect the balance due.
            </p>
            {!editingPayment?.isWaived ? <p className="mt-2 text-sm text-muted">Vendor and other expenses stay on the order; they are spent from total received, not from this payment.</p> : null}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4 bg-surface/50">
            <button type="button" onClick={closeDeleteDialog} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="submit" disabled={isPending} className="inline-flex min-h-10 items-center rounded-lg border border-error/20 bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50">
              {isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

function PaymentRow({ 
  payment,
  openEditDialog,
  openDeleteDialog
}: { 
  payment: OrderPaymentRecord, 
  openEditDialog: (payment: OrderPaymentRecord) => void,
  openDeleteDialog: (payment: OrderPaymentRecord) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${payment.isWaived ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {payment.isWaived ? <HandCoins className="size-4" /> : <IndianRupee className="size-4" />}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-base">₹{payment.amount}</p>
            {payment.isWaived && <span className="inline-block rounded border border-border bg-surface px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-muted">Waived</span>}
          </div>
          <p className="text-sm text-muted">{displayPaymentDate(payment.date)}</p>
          {payment.notes && <p className="mt-1 text-sm text-muted max-w-prose text-pretty">{payment.notes}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 flex-wrap justify-end sm:justify-start">
        <button
          type="button"
          onClick={() => openEditDialog(payment)}
          className="inline-flex min-h-11 min-w-11 justify-center items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
          aria-label="Edit payment"
          title="Edit payment"
        >
          <Pencil className="size-3.5" aria-hidden /><span>Edit</span>
        </button>
        <button
          type="button"
          onClick={() => openDeleteDialog(payment)}
          className="inline-flex min-h-11 min-w-11 justify-center items-center gap-1.5 rounded-lg border border-error/20 bg-error-soft px-2.5 py-1 text-xs font-medium text-error transition-colors hover:bg-error-soft/80"
          aria-label="Delete payment"
          title="Delete payment"
        >
          <Trash2 className="size-3.5" aria-hidden /><span>Delete</span>
        </button>
      </div>
    </div>
  );
}
