"use client";

import { useState, useRef, useTransition } from "react";
import { Plus, IndianRupee, Pencil, Trash2 } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

import type { VendorWithMaterials } from "@/app/vendors/actions";
import type { VendorPaymentRecord, OrderDropdownItem } from "./actions";
import { createVendorPayment, updateVendorPayment, deleteVendorPayment } from "./actions";
import { toast } from "sonner";

type VendorFinanceClientProps = {
  vendor: VendorWithMaterials;
  payments: VendorPaymentRecord[];
  orders: OrderDropdownItem[];
};

export function VendorFinanceClient({ vendor, payments, orders }: VendorFinanceClientProps) {
  const [isPending, startTransition] = useTransition();
  const paymentDialogRef = useRef<HTMLDialogElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [editingPayment, setEditingPayment] = useState<VendorPaymentRecord | null>(null);

  function openPaymentDialog() {
    paymentDialogRef.current?.showModal();
  }

  function closePaymentDialog() {
    paymentDialogRef.current?.close();
  }

  function openEditDialog(payment: VendorPaymentRecord) {
    setEditingPayment(payment);
    editDialogRef.current?.showModal();
  }

  function closeEditDialog() {
    editDialogRef.current?.close();
    setEditingPayment(null);
  }

  function openDeleteDialog(payment: VendorPaymentRecord) {
    setEditingPayment(payment);
    deleteDialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    deleteDialogRef.current?.close();
    setEditingPayment(null);
  }

  async function handleAddPayment(formData: FormData) {
    formData.append("vendorId", String(vendor.id));
    startTransition(async () => {
      const res = await createVendorPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment out added");
        closePaymentDialog();
      }
    });
  }

  async function handleEditPayment(formData: FormData) {
    if (!editingPayment) return;
    formData.append("vendorId", String(vendor.id));
    formData.append("id", String(editingPayment.id));
    startTransition(async () => {
      const res = await updateVendorPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment out updated");
        closeEditDialog();
      }
    });
  }

  async function handleDeletePayment(formData: FormData) {
    if (!editingPayment) return;
    formData.append("vendorId", String(vendor.id));
    formData.append("id", String(editingPayment.id));
    startTransition(async () => {
      const res = await deleteVendorPayment(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment out deleted");
        closeDeleteDialog();
      }
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-8 items-start">
      {/* Left Panel: Command Center */}
      <div className="lg:sticky lg:top-8 flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-1">{vendor.name}</h2>
          <p className="text-sm text-muted mb-8">Manage payments made to this vendor</p>
          
          <div className="mb-8 rounded-xl py-8 px-4 border shadow-sm text-center bg-surface border-border">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3 text-muted">
              Total Paid Out
            </p>
            <p className="text-5xl font-extrabold tracking-tight text-foreground">
              ₹{totalPaid}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={openPaymentDialog} 
              className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-5" />
              Record Payment Out
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Ledger */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold text-foreground px-1 lg:mt-2">Payment Ledger</h3>
        
        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center">
            <p className="text-base font-medium text-foreground">No payments yet</p>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto">Record a payment made to this vendor to see it here.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-background divide-y divide-border shadow-sm">
            {payments.map((payment) => (
              <PaymentRow 
                key={payment.id} 
                payment={payment} 
                openEditDialog={openEditDialog}
                openDeleteDialog={openDeleteDialog}
                orders={orders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Payment Dialog */}
      <dialog ref={paymentDialogRef} className="app-dialog" onClose={closePaymentDialog}>
        <form action={handleAddPayment} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add Payment Out</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Amount (₹) *</span>
                <input required type="number" name="amount" min="1" step="1" className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Link to Order (Optional)</span>
                <select name="orderId" defaultValue="" className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30">
                  <option value="">-- No Order Selected --</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderId} - {order.date} ({order.venue})
                    </option>
                  ))}
                </select>
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

      {/* Edit Payment Dialog */}
      <dialog ref={editDialogRef} className="app-dialog" onClose={closeEditDialog}>
        <form action={handleEditPayment} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Edit Payment Out</h2>
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
                <span className="mb-1.5 block text-sm font-medium text-foreground">Link to Order (Optional)</span>
                <select name="orderId" defaultValue={editingPayment?.orderId || ""} className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30">
                  <option value="">-- No Order Selected --</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderId} - {order.date} ({order.venue})
                    </option>
                  ))}
                </select>
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

      {/* Delete Payment Dialog */}
      <dialog ref={deleteDialogRef} className="app-dialog" onClose={closeDeleteDialog}>
        <form action={handleDeletePayment} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Delete Payment Out?</h2>
            <p className="text-sm text-muted">
              Are you sure you want to delete this payment of <span className="font-bold text-foreground">₹{editingPayment?.amount}</span>? This action cannot be undone.
            </p>
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
  openDeleteDialog,
  orders
}: { 
  payment: VendorPaymentRecord, 
  openEditDialog: (payment: VendorPaymentRecord) => void,
  openDeleteDialog: (payment: VendorPaymentRecord) => void,
  orders: OrderDropdownItem[]
}) {
  const linkedOrder = payment.orderId ? orders.find(o => o.id === payment.orderId) : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
          <IndianRupee className="size-4" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-base">₹{payment.amount}</p>
            {linkedOrder && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {linkedOrder.orderId}
              </span>
            )}
          </div>
          <p className="text-sm text-muted">{dateFormatter.format(new Date(payment.date))}</p>
          {payment.notes && <p className="mt-1 text-sm text-muted max-w-prose text-pretty">{payment.notes}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 flex-wrap justify-end sm:justify-start">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); openEditDialog(payment); }}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
          title="Edit"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); openDeleteDialog(payment); }}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-error/20 bg-error-soft px-2.5 py-1 text-xs font-medium text-error transition-colors hover:bg-error-soft/80"
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
