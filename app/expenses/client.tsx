"use client";

import Link from "next/link";
import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { buildVendorLedger } from "@/lib/expenses/vendor-ledger";
import {
  getOrderExpenseLedger, createExpense, deleteExpense, createVendorPaymentForExpenses,
  type OrderExpenseLedger, type OrderSelectionItem, type VendorDropdownItem,
} from "./actions";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const displayDate = (date: string) => dateFormatter.format(new Date(`${date}T12:00:00`));
const fieldClass = "min-h-12 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50";
const primaryButton = "inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const secondaryButton = "inline-flex min-h-12 touch-manipulation items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type ExpensesClientProps = { orders: OrderSelectionItem[]; vendors: VendorDropdownItem[] };

export function ExpensesClient({ orders, vendors }: ExpensesClientProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<number | "">("");
  const [ledger, setLedger] = useState<OrderExpenseLedger | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"vendor" | "expense">("vendor");
  const [showForm, setShowForm] = useState(false);
  const [expenseToRemove, setExpenseToRemove] = useState<number | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const selectedRef = useRef<number | "">("");
  const requestVersion = useRef(0);

  const refreshLedger = useCallback(async (orderId: number) => {
    const version = ++requestVersion.current;
    try {
      const result = await getOrderExpenseLedger(orderId);
      if (selectedRef.current !== orderId || version !== requestVersion.current) return;
      setLedger(result);
      setLoadError(result ? null : "This order is no longer available. Choose another order.");
    } catch {
      if (selectedRef.current === orderId && version === requestVersion.current) {
        setLoadError("Could not load this order's ledger. Please retry.");
      }
    }
  }, []);

  useEffect(() => {
    if (selectedOrderId !== "") startLoading(async () => { await refreshLedger(selectedOrderId); });
  }, [selectedOrderId, refreshLedger]);

  function selectOrder(value: string) {
    const id = value ? Number(value) : "";
    selectedRef.current = id;
    requestVersion.current++;
    setSelectedOrderId(id);
    setLedger(null);
    setLoadError(null);
    setEntryError(null);
    setActiveTab("vendor");
    setShowForm(false);
    setExpenseToRemove(null);
  }

  function selectTab(tab: "vendor" | "expense") {
    setActiveTab(tab);
    setShowForm(false);
    setEntryError(null);
    setExpenseToRemove(null);
  }

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedOrderId === "" || isSaving) return;
    const orderId = selectedOrderId;
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("orderId", String(orderId));
    const isVendor = activeTab === "vendor";
    setEntryError(null);
    startSaving(async () => {
      try {
        const result = isVendor ? await createVendorPaymentForExpenses(data) : await createExpense(data);
        if (result.error) { setEntryError(result.error); return; }
        form.reset();
        toast.success(isVendor ? "Vendor payment recorded" : "Expense recorded");
        await refreshLedger(orderId);
        setShowForm(false);
      } catch {
        setEntryError("Could not save this entry. Please try again.");
      }
    });
  }

  function removeExpense(id: number) {
    if (selectedOrderId === "" || isSaving) return;
    const orderId = selectedOrderId;
    const data = new FormData();
    data.set("id", String(id));
    data.set("orderId", String(orderId));
    startSaving(async () => {
      try {
        const result = await deleteExpense(data);
        if (result.error) { toast.error(result.error); return; }
        toast.success("Expense removed");
        setExpenseToRemove(null);
        await refreshLedger(orderId);
      } catch { toast.error("Could not remove the expense. Please try again."); }
    });
  }

  const vendorLedger = ledger ? buildVendorLedger(ledger.linkedVendors, ledger.vendorPayments) : [];
  const receipts = ledger?.payments.filter(payment => !payment.isWaived) ?? [];
  const expenses = ledger?.payments.flatMap(payment => payment.expenses.map(expense => ({ ...expense, receiptAmount: payment.amount })))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id) ?? [];
  const linkedIds = new Set(ledger?.linkedVendors.map(vendor => vendor.id));
  const otherVendors = vendors.filter(vendor => !linkedIds.has(vendor.id));
  const isVendor = activeTab === "vendor";

  return <div className="max-w-5xl space-y-6">
    <label className="block max-w-xl">
      <span className="mb-2 block text-sm font-semibold text-foreground">Order</span>
      <select className={fieldClass} value={selectedOrderId} disabled={isSaving} onChange={event => selectOrder(event.target.value)}>
        <option value="">Choose an order</option>
        {orders.map(order => <option key={order.id} value={order.id}>{order.orderId} · {order.date} · {order.venue}</option>)}
      </select>
    </label>
    {selectedOrderId === "" ? <p className="py-6 text-sm text-muted">Choose an order to see what you received, what you paid vendors, and your other expenses.</p> : null}
    {isLoading ? <p role="status" className="py-4 text-sm text-muted">Loading order ledger…</p> : null}
    {loadError ? <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
      <p className="flex-1 text-sm text-error">{loadError}</p>
      <button type="button" className={secondaryButton} disabled={isLoading || isSaving} onClick={() => { if (selectedOrderId !== "") startLoading(async () => { await refreshLedger(selectedOrderId); }); }}>Retry</button>
    </div> : null}
    {ledger && !isLoading ? <div className="space-y-6" aria-busy={isSaving}>
      <section aria-label="Order cash summary">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 md:grid-cols-4">
          {[
            ["Client received", ledger.summary.clientPaid],
            ["Vendor paid", ledger.summary.vendorExpenses],
            ["Other expenses", ledger.summary.otherExpenses],
            ["Cash remaining", ledger.summary.netProfit],
          ].map(([label, amount]) => <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className={`mt-1 text-xl font-semibold tabular-nums ${label === "Cash remaining" ? Number(amount) < 0 ? "text-error" : "text-primary" : "text-foreground"}`}>{formatCurrency(Number(amount))}</dd>
          </div>)}
        </dl>
        <p className="mt-2 text-xs text-muted">Cash remaining = client received − vendor paid − other expenses.</p>
      </section>
      <div className="flex gap-2 border-b border-border" aria-label="Expense type">
        <button type="button" aria-pressed={isVendor} disabled={isSaving} onClick={() => selectTab("vendor")} className={`min-h-12 touch-manipulation border-b-2 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isVendor ? "border-primary text-primary" : "border-transparent text-muted"}`}>Vendor payments</button>
        <button type="button" aria-pressed={!isVendor} disabled={isSaving} onClick={() => selectTab("expense")} className={`min-h-12 touch-manipulation border-b-2 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!isVendor ? "border-primary text-primary" : "border-transparent text-muted"}`}>Other expenses</button>
      </div>
      <section className="space-y-4" aria-label={isVendor ? "Vendor payments" : "Other expenses"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{isVendor ? "Paid to vendors" : "Other expenses"}</h2>
            <p className="mt-1 text-sm text-muted">{isVendor ? "Total paid to each vendor for this order. Open a row for payment history." : "Transport, labour and other costs, linked to client payments received."}</p>
          </div>
          {!showForm && (isVendor || receipts.length > 0) ? <button type="button" className={primaryButton} disabled={isSaving || (isVendor && vendors.length === 0)} onClick={() => { setShowForm(true); setEntryError(null); }}><Plus className="size-4" aria-hidden />{isVendor ? "Add vendor payment" : "Add expense"}</button> : null}
        </div>
        {showForm ? <form onSubmit={addEntry} className="rounded-xl border border-border bg-surface/40 p-4 sm:p-5">
          <fieldset disabled={isSaving} className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {isVendor ? <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Vendor</span>
              <select name="vendorId" required defaultValue="" className={fieldClass}>
                <option value="" disabled>Choose a vendor</option>
                {ledger.linkedVendors.length ? <optgroup label="Order vendors">{ledger.linkedVendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</optgroup> : null}
                {otherVendors.length ? <optgroup label="Other vendors">{otherVendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</optgroup> : null}
              </select>
            </label> : <>
              <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Description</span><input name="description" required maxLength={240} placeholder="e.g. Transport or labour" className={fieldClass} /></label>
              <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Client payment received</span>
                <select name="orderPaymentId" required defaultValue={receipts[0]?.id} className={fieldClass}>{receipts.map(receipt => <option key={receipt.id} value={receipt.id}>{formatCurrency(receipt.amount)} · {displayDate(receipt.date)} · Receipt #{receipt.id}</option>)}</select>
              </label>
            </>}
            <label className="block min-w-0"><span className="mb-1.5 block text-sm font-medium">Amount (₹)</span><input name="amount" type="number" inputMode="numeric" min="1" max="2147483647" step="1" required placeholder="0" className={`${fieldClass} tabular-nums`} /></label>
            <label className="block min-w-0"><span className="mb-1.5 block text-sm font-medium">Date</span><input name="date" type="date" defaultValue={today()} required className={fieldClass} /></label>
            {isVendor ? <label className="block min-w-0 sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">Notes (optional)</span><input name="notes" maxLength={240} placeholder="e.g. Advance for vegetables" className={fieldClass} /></label> : null}
          </fieldset>
          {entryError ? <p role="alert" className="mt-3 text-sm text-error">{entryError}</p> : null}
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button type="button" className={secondaryButton} disabled={isSaving} onClick={() => { setShowForm(false); setEntryError(null); }}>Cancel</button>
            <button type="submit" className={primaryButton} disabled={isSaving}>{isSaving ? "Saving…" : isVendor ? "Save vendor payment" : "Save expense"}</button>
          </div>
        </form> : null}
        {isVendor ? <>
          {vendors.length === 0 ? <p className="text-sm text-muted">Add a vendor in <Link className="font-medium text-primary underline" href="/vendors">Vendors</Link> to record a payment.</p> : null}
          {vendorLedger.length ? <div className="divide-y divide-border rounded-xl border border-border">
            {vendorLedger.map(vendor => <details key={vendor.id} className="group">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5">
                <span className="min-w-0"><span className="block break-words font-semibold text-foreground">{vendor.name}</span><span className="mt-1 block text-xs text-muted">{vendor.payments.length ? `${vendor.payments.length} payment${vendor.payments.length === 1 ? "" : "s"}` : "No payments yet"}</span></span>
                <span className="flex shrink-0 items-center gap-3"><span className="font-semibold tabular-nums text-foreground">{formatCurrency(vendor.totalPaid)}</span><ChevronDown className="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden /></span>
              </summary>
              <div className="border-t border-border bg-surface/30 px-4 pb-4 sm:px-5">
                {vendor.payments.length ? <table className="w-full text-left text-sm"><caption className="sr-only">Payment history for {vendor.name}</caption><thead><tr className="text-muted"><th className="py-3 pr-3 font-medium">Date</th><th className="py-3 pr-3 font-medium">Amount</th><th className="py-3 font-medium">Notes</th></tr></thead><tbody>{vendor.payments.map(payment => <tr key={payment.id} className="border-t border-border"><td className="py-3 pr-3 whitespace-nowrap">{displayDate(payment.date)}</td><td className="py-3 pr-3 whitespace-nowrap tabular-nums">{formatCurrency(payment.amount)}</td><td className="py-3 break-words">{payment.notes || "—"}</td></tr>)}</tbody></table> : <p className="py-4 text-sm text-muted">No vendor payments recorded for this order.</p>}
                <Link href={`/vendors/${vendor.id}/finance`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">View vendor account</Link>
              </div>
            </details>)}
          </div> : <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted">No vendor payments recorded for this order yet. Add a payment to any vendor above.</p>}
        </> : <>
          {!receipts.length ? <div className="rounded-lg border border-border p-4 text-sm"><p className="text-muted">Record a client payment received before adding other expenses.</p><Link href={`/orders/${selectedOrderId}/finance`} className="mt-2 inline-flex min-h-11 items-center font-medium text-primary underline">Record client payment</Link></div> : null}
          {expenses.length ? <ul className="divide-y divide-border rounded-xl border border-border">{expenses.map(expense => <li key={expense.id} className="px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0"><p className="break-words text-sm font-medium text-foreground">{expense.description}</p><p className="mt-1 text-xs text-muted">{displayDate(expense.date)} · From {formatCurrency(expense.receiptAmount)} received</p></div>
              <div className="flex shrink-0 items-center gap-2"><span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(expense.amount)}</span><button type="button" aria-label={`Remove expense: ${expense.description}`} disabled={isSaving} onClick={() => setExpenseToRemove(expense.id)} className="inline-flex size-11 touch-manipulation items-center justify-center rounded-lg text-muted hover:bg-error-soft hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="size-4" aria-hidden /></button></div>
            </div>
            {expenseToRemove === expense.id ? <div className="mt-3 flex flex-wrap items-center gap-3"><p className="mr-auto text-sm text-foreground">Remove this expense?</p><button type="button" disabled={isSaving} className={secondaryButton} onClick={() => setExpenseToRemove(null)}>Cancel</button><button type="button" disabled={isSaving} className="min-h-12 rounded-lg bg-error px-4 text-sm font-semibold text-white" onClick={() => removeExpense(expense.id)}>{isSaving ? "Removing…" : "Remove expense"}</button></div> : null}
          </li>)}</ul> : <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted"><ReceiptText className="size-5 shrink-0" aria-hidden /><p>No other expenses recorded for this order yet.</p></div>}
        </>}
      </section>
    </div> : null}
  </div>;
}
