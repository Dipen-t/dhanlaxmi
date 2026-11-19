"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { deleteExpense, deleteVendorExpense, updateLedgerEntry, type VendorDropdownItem } from "@/app/expenses/actions";
import { formatCurrency } from "@/lib/utils";

type Entry = { id: number; amount: number; date: string; description?: string; notes?: string | null; vendorId?: number; vendorName?: string };
const field = "mt-1.5 min-h-12 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ExpenseEntryActions({ orderId, kind, entry, vendors, onChanged }: { orderId: number; kind: "vendor" | "expense"; entry: Entry; vendors: VendorDropdownItem[]; onChanged: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [mode, setMode] = useState<"edit" | "delete">("edit");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0);
  const titleId = useId();
  const label = kind === "vendor" ? `vendor payment to ${entry.vendorName}` : `expense: ${entry.description}`;

  function open(next: "edit" | "delete") { setMode(next); setError(""); setFormKey(current => current + 1); dialog.current?.showModal(); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    data.set("id", String(entry.id)); data.set("orderId", String(orderId)); data.set("kind", kind);
    try {
      const result = mode === "edit" ? await updateLedgerEntry(data) : kind === "vendor" ? await deleteVendorExpense(data) : await deleteExpense(data);
      if (result.error) { setError(result.error); return; }
      toast.success(mode === "edit" ? "Entry updated" : "Entry deleted");
      dialog.current?.close();
      await onChanged();
    } catch { setError("Could not save the change. Refresh the ledger and try again."); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <>
    <button type="button" onClick={() => open("edit")} aria-label={`Edit ${label}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 px-2 rounded-lg text-muted hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Pencil className="size-4" aria-hidden /><span className="text-sm">Edit</span></button>
    <button type="button" onClick={() => open("delete")} aria-label={`Delete ${label}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 px-2 rounded-lg text-muted hover:bg-error-soft hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="size-4" aria-hidden /><span className="text-sm">Delete</span></button>
    <dialog ref={dialog} className="app-dialog" aria-labelledby={titleId} onCancel={event => { if (busyRef.current) event.preventDefault(); }}>
      <form key={formKey} onSubmit={submit} className="flex min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-5 pt-5 pb-4">
          <h2 id={titleId} className="text-lg font-semibold">{mode === "edit" ? "Edit" : "Delete"} {kind === "vendor" ? "vendor expense" : "other expense"}</h2>
          {mode === "delete" ? <p className="text-sm">Delete {label} of {formatCurrency(entry.amount)}? This removes the recorded spend and recalculates the balances. This cannot be undone.</p> : <fieldset disabled={busy} className="min-w-0 space-y-4">
            {kind === "vendor" ? <label className="block text-sm font-medium">Vendor<select name="vendorId" required defaultValue={entry.vendorId} className={field}>{vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label> : <label className="block text-sm font-medium">Description<input name="description" required maxLength={240} defaultValue={entry.description} className={field} /></label>}
            <label className="block text-sm font-medium">Amount (₹)<input name="amount" type="number" inputMode="numeric" min={1} max={2147483647} step={1} required defaultValue={entry.amount} className={field} /></label>
            <label className="block text-sm font-medium">Date<input name="date" type="date" required defaultValue={entry.date} className={field} /></label>
            {kind === "vendor" ? <label className="block text-sm font-medium">Notes (optional)<input name="notes" maxLength={240} defaultValue={entry.notes || ""} className={field} /></label> : null}
          </fieldset>}
          {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-5 py-4">
          <button type="button" disabled={busy} onClick={() => dialog.current?.close()} className="min-h-12 rounded-lg border border-border px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={busy} className={`min-h-12 rounded-lg px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${mode === "delete" ? "bg-error text-white" : "bg-primary text-primary-foreground"}`}>{busy ? "Saving…" : mode === "edit" ? "Save changes" : "Delete entry"}</button>
        </div>
      </form>
    </dialog>
  </>;
}
