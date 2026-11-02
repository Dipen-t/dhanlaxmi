"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { VendorWithMaterials } from "@/app/vendors/actions";
import { formatCurrency, todayCalendarDateString } from "@/lib/utils";
import {
  createVendorPayment,
  deleteVendorPayment,
  updateVendorPayment,
  type OrderDropdownItem,
  type VendorPaymentRecord,
} from "./actions";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function displayDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

const mealLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

type LinkFilter = "all" | "linked" | "unlinked";
type SortKey = "date" | "amount" | "customer" | "order";
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

type VendorFinanceClientProps = {
  vendor: VendorWithMaterials;
  payments: VendorPaymentRecord[];
  orders: OrderDropdownItem[];
};

export function VendorFinanceClient({
  vendor,
  payments,
  orders,
}: VendorFinanceClientProps) {
  const [isPending, startTransition] = useTransition();
  const paymentDialogRef = useRef<HTMLDialogElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [editingPayment, setEditingPayment] = useState<VendorPaymentRecord | null>(
    null,
  );

  const [query, setQuery] = useState("");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [page, setPage] = useState(1);

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

  const today = todayCalendarDateString();
  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const linkedCount = payments.filter((p) => p.orderId != null).length;
  const unlinkedCount = payments.length - linkedCount;

  const filteredPayments = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const filtered = payments.filter((payment) => {
      if (linkFilter === "linked" && payment.orderId == null) return false;
      if (linkFilter === "unlinked" && payment.orderId != null) return false;
      if (!normalized) return true;

      const order = payment.order;
      const haystack = [
        String(payment.amount),
        payment.date,
        displayDate(payment.date),
        payment.notes ?? "",
        order?.orderNumber ?? "",
        order?.customerName ?? "",
        order?.venue ?? "",
        order?.menuName ?? "",
        order?.mealType ?? "",
        mealLabels[order?.mealType ?? ""] ?? "",
        order?.date ? displayDate(order.date) : "",
        ...(order?.dishNames ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "customer":
          cmp = (a.order?.customerName ?? "")
            .toLowerCase()
            .localeCompare((b.order?.customerName ?? "").toLowerCase());
          break;
        case "order":
          cmp = (a.order?.orderNumber ?? "")
            .toLowerCase()
            .localeCompare((b.order?.orderNumber ?? "").toLowerCase());
          break;
        case "date":
        default:
          cmp = a.date.localeCompare(b.date);
          break;
      }
      if (cmp === 0) cmp = a.id - b.id;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [payments, query, linkFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagePayments = filteredPayments.slice(pageStart, pageStart + pageSize);
  const pageEnd = Math.min(pageStart + pageSize, filteredPayments.length);
  const filteredTotal = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  useEffect(() => {
    setPage(1);
  }, [query, linkFilter, sortKey, sortDir, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const hasQuery = query.trim().length > 0;
  const hasActiveFilters = hasQuery || linkFilter !== "all";

  function changeSortKey(nextKey: SortKey) {
    setSortKey(nextKey);
    setSortDir(nextKey === "customer" || nextKey === "order" ? "asc" : "desc");
  }

  function clearFilters() {
    setQuery("");
    setLinkFilter("all");
  }

  const selectClass =
    "min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[340px_1fr] lg:gap-8">
      <div className="flex flex-col gap-6 lg:sticky lg:top-8">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="mb-1 text-xl font-bold text-foreground">{vendor.name}</h2>
          <p className="mb-8 text-sm text-muted">Manage payments made to this vendor</p>

          <div className="mb-6 rounded-xl border border-border bg-background px-4 py-7 text-center shadow-sm">
            <p className="mb-3 text-sm font-semibold tracking-widest text-muted uppercase">
              Total Paid Out
            </p>
            <p className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              {formatCurrency(totalPaid)}
            </p>
            <p className="mt-3 text-sm text-muted">
              {payments.length} payment{payments.length === 1 ? "" : "s"}
              {linkedCount > 0 || unlinkedCount > 0 ? (
                <>
                  {" · "}
                  {linkedCount} linked
                  {unlinkedCount > 0 ? ` · ${unlinkedCount} open` : ""}
                </>
              ) : null}
            </p>
          </div>

          <button
            type="button"
            onClick={openPaymentDialog}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" />
            Record Payment Out
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1 px-1 lg:mt-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Payment Ledger</h3>
            <p className="text-sm text-muted">
              {hasActiveFilters
                ? `${filteredPayments.length} of ${payments.length} payments`
                : `${payments.length} payment${payments.length === 1 ? "" : "s"}`}
              {hasActiveFilters ? (
                <>
                  {" · "}
                  filtered total {formatCurrency(filteredTotal)}
                </>
              ) : null}
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center">
            <p className="text-base font-medium text-foreground">No payments yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Record a payment made to this vendor to see it here.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-4">
              <div className="flex flex-col gap-3">
                <label className="relative block min-w-0 flex-1">
                  <span className="sr-only">Search payments</span>
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search customer, order, menu, notes…"
                    autoComplete="off"
                    className="min-h-11 w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-10 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                  {hasQuery ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  ) : null}
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div
                    className="inline-flex w-full rounded-lg border border-border bg-background p-1 sm:w-auto"
                    role="group"
                    aria-label="Filter by order link"
                  >
                    {(
                      [
                        { id: "all", label: "All", count: payments.length },
                        { id: "linked", label: "Linked", count: linkedCount },
                        { id: "unlinked", label: "Unlinked", count: unlinkedCount },
                      ] as const
                    ).map((option) => {
                      const active = linkFilter === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setLinkFilter(option.id)}
                          className={`inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors sm:flex-none ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-muted hover:bg-surface hover:text-foreground"
                          }`}
                        >
                          {option.label}
                          <span
                            className={`tabular-nums text-xs ${
                              active ? "text-primary-foreground/80" : "text-muted"
                            }`}
                          >
                            {option.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex min-w-0 items-center gap-2 text-sm text-muted">
                      <span className="shrink-0">Sort</span>
                      <select
                        value={sortKey}
                        onChange={(event) =>
                          changeSortKey(event.target.value as SortKey)
                        }
                        className={selectClass}
                        aria-label="Sort by"
                      >
                        <option value="date">Payment date</option>
                        <option value="amount">Amount</option>
                        <option value="customer">Customer</option>
                        <option value="order">Order number</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
                      }
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={
                        sortDir === "asc" ? "Sort ascending" : "Sort descending"
                      }
                      title={sortDir === "asc" ? "Ascending" : "Descending"}
                    >
                      {sortDir === "asc" ? (
                        <ArrowUpAZ className="size-4" strokeWidth={1.75} />
                      ) : (
                        <ArrowDownAZ className="size-4" strokeWidth={1.75} />
                      )}
                      <span className="hidden sm:inline">
                        {sortDir === "asc" ? "Asc" : "Desc"}
                      </span>
                    </button>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-14 text-center">
                <p className="text-base font-medium text-foreground">
                  No matching payments
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Try a different search or clear the active filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                  <div className="divide-y divide-border">
                    {pagePayments.map((payment) => (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                        openEditDialog={openEditDialog}
                        openDeleteDialog={openDeleteDialog}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span>
                      {filteredPayments.length === 0
                        ? "No results"
                        : `Showing ${pageStart + 1}–${pageEnd} of ${filteredPayments.length}`}
                    </span>
                    <label className="inline-flex items-center gap-2">
                      <span>Rows</span>
                      <select
                        value={pageSize}
                        onChange={(event) =>
                          setPageSize(
                            Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number],
                          )
                        }
                        className="min-h-9 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                        aria-label="Rows per page"
                      >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronLeft className="size-4" strokeWidth={1.75} />
                      Prev
                    </button>
                    <span className="min-w-[5.5rem] text-center text-sm tabular-nums text-muted">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Next
                      <ChevronRight className="size-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <dialog ref={paymentDialogRef} className="app-dialog" onClose={closePaymentDialog}>
        <form action={handleAddPayment} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Add Payment Out</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Amount (₹) *
                </span>
                <input
                  required
                  type="number"
                  name="amount"
                  min="1"
                  step="1"
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Link to Order (Optional)
                </span>
                <select
                  name="orderId"
                  defaultValue=""
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">-- No Order Selected --</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderId}
                      {order.customerName ? ` · ${order.customerName}` : ""} — {order.date} (
                      {order.venue})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Date *
                </span>
                <input
                  required
                  type="date"
                  name="date"
                  defaultValue={today}
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Notes</span>
                <textarea
                  name="notes"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                ></textarea>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border bg-surface/50 px-5 py-4">
            <button
              type="button"
              onClick={closePaymentDialog}
              className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isPending ? "Adding..." : "Add Payment"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={editDialogRef} className="app-dialog" onClose={closeEditDialog}>
        <form action={handleEditPayment} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Edit Payment Out</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Amount (₹) *
                </span>
                <input
                  required
                  type="number"
                  name="amount"
                  min="1"
                  step="1"
                  defaultValue={editingPayment?.amount}
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Date *
                </span>
                <input
                  required
                  type="date"
                  name="date"
                  defaultValue={editingPayment?.date}
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Link to Order (Optional)
                </span>
                <select
                  name="orderId"
                  defaultValue={editingPayment?.orderId || ""}
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">-- No Order Selected --</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.orderId}
                      {order.customerName ? ` · ${order.customerName}` : ""} — {order.date} (
                      {order.venue})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Notes</span>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingPayment?.notes || ""}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                ></textarea>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border bg-surface/50 px-5 py-4">
            <button
              type="button"
              onClick={closeEditDialog}
              className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={deleteDialogRef} className="app-dialog" onClose={closeDeleteDialog}>
        <form action={handleDeletePayment} className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Delete Payment Out?</h2>
            <p className="text-sm text-muted">
              Are you sure you want to delete this payment of{" "}
              <span className="font-bold text-foreground">
                {formatCurrency(editingPayment?.amount)}
              </span>
              ? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-border bg-surface/50 px-5 py-4">
            <button
              type="button"
              onClick={closeDeleteDialog}
              className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-10 items-center rounded-lg border border-error/20 bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50"
            >
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
}: {
  payment: VendorPaymentRecord;
  openEditDialog: (payment: VendorPaymentRecord) => void;
  openDeleteDialog: (payment: VendorPaymentRecord) => void;
}) {
  const order = payment.order;
  const mealLabel = order ? mealLabels[order.mealType] ?? order.mealType : null;
  const dishPreview =
    order && order.dishNames.length > 0
      ? order.dishNames.slice(0, 3).join(", ") +
        (order.dishNames.length > 3 ? ` +${order.dishNames.length - 3}` : "")
      : null;

  return (
    <div className="flex flex-col gap-4 p-4 transition-colors hover:bg-surface/40 sm:flex-row sm:items-start sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
          <IndianRupee className="size-4" />
        </span>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-foreground tabular-nums">
              {formatCurrency(payment.amount)}
            </p>
            {order ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {order.orderNumber}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-muted/20 px-2 py-0.5 text-xs font-medium text-muted">
                Unlinked
              </span>
            )}
          </div>

          <p className="text-sm text-muted">{displayDate(payment.date)}</p>

          {order ? (
            <div className="space-y-1 pt-0.5">
              <p className="text-sm text-foreground">
                <span className="font-medium">
                  {order.customerName?.trim() || "Unnamed customer"}
                </span>
                <span className="text-muted">
                  {" · "}
                  {order.venue}
                  {mealLabel ? ` · ${mealLabel}` : ""}
                </span>
              </p>
              <p className="text-sm text-muted">
                Event {displayDate(order.date)}
                {order.menuName ? (
                  <>
                    {" · "}
                    <span className="inline-flex items-center gap-1 text-foreground/80">
                      <UtensilsCrossed className="size-3.5 shrink-0" strokeWidth={1.75} />
                      {order.menuName}
                    </span>
                  </>
                ) : dishPreview ? (
                  <>
                    {" · "}
                    <span className="inline-flex items-center gap-1 text-foreground/80">
                      <UtensilsCrossed className="size-3.5 shrink-0" strokeWidth={1.75} />
                      Custom selection
                    </span>
                  </>
                ) : null}
              </p>
              {dishPreview ? (
                <p className="text-xs text-muted text-pretty">{dishPreview}</p>
              ) : null}
            </div>
          ) : null}

          {payment.notes ? (
            <p className="max-w-prose text-sm text-muted text-pretty">{payment.notes}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:justify-start">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            openEditDialog(payment);
          }}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
          title="Edit"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            openDeleteDialog(payment);
          }}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-error/20 bg-error-soft px-2.5 py-1 text-xs font-medium text-error transition-colors hover:bg-error-soft/80"
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
