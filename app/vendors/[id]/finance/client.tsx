"use client";

import { useState, useRef, useTransition } from "react";
import { Receipt, HandCoins, Pencil, Trash2 } from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

import type { VendorWithMaterials } from "@/app/vendors/actions";
import type { VendorPaymentRecord } from "./actions";
import { createVendorPayment, updateVendorPayment, deleteVendorPayment } from "./actions";
import { FloatingAddButton } from "@/components/floating-add-button";
import { toast } from "sonner";

type VendorFinanceClientProps = {
  vendor: VendorWithMaterials;
  payments: VendorPaymentRecord[];
};

export function VendorFinanceClient({ vendor, payments }: VendorFinanceClientProps) {
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

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-foreground">{vendor.name} Finances</h2>
        <p className="text-sm text-muted">Manage payments made to this vendor.</p>
        <div className="mt-4 flex gap-4">
          <div className="flex-1 rounded-lg bg-error-soft p-4 border border-error/20">
            <p className="text-sm text-error">Total Paid Out</p>
            <p className="text-2xl font-bold text-error">
              ₹{payments.reduce((acc, p) => acc + p.amount, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Payments Out</h3>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-base font-medium text-foreground">No payments yet</p>
            <p className="mt-1 text-sm text-muted">Add a payment made to this vendor.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-xl border border-border bg-background p-4 sm:p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-error/10 text-error">
                        <Receipt className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground text-lg">₹{payment.amount}</p>
                        <p className="text-sm text-muted">{dateFormatter.format(new Date(payment.date))}</p>
                      </div>
                    </div>
                    {payment.notes && <p className="mt-2 text-sm text-muted text-pretty">{payment.notes}</p>}
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 ml-4 shrink-0">
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
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingAddButton onClick={openPaymentDialog} label="Add Payment Out" />

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
            <button type="submit" disabled={isPending} className="inline-flex min-h-10 items-center rounded-lg bg-error px-4 text-sm font-medium text-error-foreground transition-colors hover:bg-error/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
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
    </>
  );
}
