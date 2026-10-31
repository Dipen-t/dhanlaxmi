"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
  useEffect,
  useRef,
  useCallback,
  useId,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash2,
  Search,
  X,
  ReceiptText,
  IndianRupee,
  ArrowLeftRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  getOrderExpenseLedger,
  createExpense,
  deleteExpense,
  createVendorPaymentForExpenses,
  type OrderExpenseLedger,
  type OrderSelectionItem,
  type VendorDropdownItem,
} from "./actions";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const displayDate = (date: string) =>
  dateFormatter.format(new Date(`${date}T12:00:00`));

const fieldClass =
  "min-h-12 w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50";
const primaryButton =
  "inline-flex min-h-12 touch-manipulation items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const secondaryButton =
  "inline-flex min-h-12 touch-manipulation items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
const quietButton =
  "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function orderMatchesQuery(order: OrderSelectionItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    order.orderId,
    order.venue,
    order.date,
    order.customerName ?? "",
    displayDate(order.date),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

type ExpensesClientProps = {
  orders: OrderSelectionItem[];
  vendors: VendorDropdownItem[];
  initialOrderId: number | null;
};

type EntryFormKind = "vendor" | "expense";

export function ExpensesClient({
  orders,
  vendors,
  initialOrderId,
}: ExpensesClientProps) {
  const router = useRouter();
  const searchTitleId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<number | "">(
    initialOrderId ?? "",
  );
  const [ledger, setLedger] = useState<OrderExpenseLedger | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<{
    paymentId: number;
    kind: EntryFormKind;
  } | null>(null);
  const [expenseToRemove, setExpenseToRemove] = useState<number | null>(null);
  const [orderQuery, setOrderQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [awaitingLedger, setAwaitingLedger] = useState(initialOrderId != null);
  const selectedRef = useRef<number | "">(initialOrderId ?? "");
  const requestVersion = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOrderPicker();
    };
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closeOrderPicker is stable enough for open lifecycle
  }, [pickerOpen]);

  const filteredOrders = useMemo(
    () => orders.filter((order) => orderMatchesQuery(order, orderQuery)),
    [orders, orderQuery],
  );

  const syncUrl = useCallback(
    (orderId: number | "") => {
      const url = orderId === "" ? "/expenses" : `/expenses?orderId=${orderId}`;
      router.replace(url, { scroll: false });
    },
    [router],
  );

  const refreshLedger = useCallback(async (orderId: number) => {
    const version = ++requestVersion.current;
    setAwaitingLedger(true);
    try {
      const result = await getOrderExpenseLedger(orderId);
      if (selectedRef.current !== orderId || version !== requestVersion.current)
        return;
      setLedger(result);
      setLoadError(
        result
          ? null
          : "This order is no longer available. Choose another order.",
      );
    } catch {
      if (
        selectedRef.current === orderId &&
        version === requestVersion.current
      ) {
        setLoadError("Could not load this order's ledger. Please retry.");
      }
    } finally {
      if (selectedRef.current === orderId && version === requestVersion.current) {
        setAwaitingLedger(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedOrderId !== "") {
      startLoading(async () => {
        await refreshLedger(selectedOrderId);
      });
    } else {
      setAwaitingLedger(false);
    }
  }, [selectedOrderId, refreshLedger]);

  function openOrderPicker() {
    setOrderQuery("");
    setPickerOpen(true);
  }

  function closeOrderPicker() {
    setPickerOpen(false);
    setOrderQuery("");
  }

  function selectOrder(id: number) {
    selectedRef.current = id;
    requestVersion.current++;
    setSelectedOrderId(id);
    setLedger(null);
    setAwaitingLedger(true);
    setLoadError(null);
    setEntryError(null);
    setActiveForm(null);
    setExpenseToRemove(null);
    syncUrl(id);
    closeOrderPicker();
  }

  function clearOrder() {
    selectedRef.current = "";
    requestVersion.current++;
    setSelectedOrderId("");
    setLedger(null);
    setAwaitingLedger(false);
    setLoadError(null);
    setEntryError(null);
    setActiveForm(null);
    setExpenseToRemove(null);
    syncUrl("");
  }

  function openForm(paymentId: number, kind: EntryFormKind) {
    setActiveForm({ paymentId, kind });
    setEntryError(null);
    setExpenseToRemove(null);
  }

  function closeForm() {
    setActiveForm(null);
    setEntryError(null);
  }

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedOrderId === "" || !activeForm || isSaving) return;
    const orderId = selectedOrderId;
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("orderId", String(orderId));
    data.set("orderPaymentId", String(activeForm.paymentId));
    const isVendor = activeForm.kind === "vendor";
    setEntryError(null);
    startSaving(async () => {
      try {
        const result = isVendor
          ? await createVendorPaymentForExpenses(data)
          : await createExpense(data);
        if (result.error) {
          setEntryError(result.error);
          return;
        }
        form.reset();
        toast.success(
          isVendor ? "Vendor payment recorded" : "Expense recorded",
        );
        await refreshLedger(orderId);
        closeForm();
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
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Expense removed");
        setExpenseToRemove(null);
        await refreshLedger(orderId);
      } catch {
        toast.error("Could not remove the expense. Please try again.");
      }
    });
  }

  const receipts = ledger?.payments.filter((payment) => !payment.isWaived) ?? [];
  const unallocatedVendorPayments =
    ledger?.vendorPayments.filter((payment) => !payment.orderPaymentId) ?? [];
  const linkedIds = new Set(ledger?.linkedVendors.map((vendor) => vendor.id));
  const otherVendors = vendors.filter((vendor) => !linkedIds.has(vendor.id));
  const selectedOrderMeta =
    ledger?.order ??
    orders.find((order) => order.id === selectedOrderId) ??
    null;

  return (
    <div className="w-full space-y-8">
      {selectedOrderId === "" ? (
        <section className="border-y border-border py-10 sm:py-14">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Choose an order
            </h2>
            <p className="mt-2 text-sm text-muted text-pretty">
              Search by order ID, customer, venue, or date. Then allocate spend
              against each payment received.
            </p>
            <button
              type="button"
              className={`${primaryButton} mt-6`}
              onClick={openOrderPicker}
            >
              <Search className="size-4" aria-hidden />
              Find order
            </button>
          </div>
        </section>
      ) : (
        <section
          aria-label="Selected order"
          className="border-b border-border pb-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Working on
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {selectedOrderMeta?.orderId ?? `Order #${selectedOrderId}`}
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                {selectedOrderMeta
                  ? [
                      displayDate(selectedOrderMeta.date),
                      selectedOrderMeta.venue,
                      selectedOrderMeta.customerName,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "Loading order details…"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButton}
                disabled={isSaving}
                onClick={openOrderPicker}
              >
                <ArrowLeftRight className="size-4" aria-hidden />
                Change order
              </button>
              <button
                type="button"
                className={quietButton}
                disabled={isSaving}
                onClick={clearOrder}
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      )}

      {selectedOrderId !== "" && (isLoading || awaitingLedger) && !ledger ? (
        <p role="status" className="py-4 text-sm text-muted">
          Loading order ledger…
        </p>
      ) : null}

      {loadError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 border border-border px-4 py-4"
        >
          <p className="flex-1 text-sm text-error">{loadError}</p>
          <button
            type="button"
            className={secondaryButton}
            disabled={isLoading || isSaving}
            onClick={() => {
              if (selectedOrderId !== "") {
                startLoading(async () => {
                  await refreshLedger(selectedOrderId);
                });
              }
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {ledger ? (
        <div className="space-y-8" aria-busy={isSaving}>
          <section aria-label="Order cash summary">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-5 md:grid-cols-4">
              {(
                [
                  ["Client received", ledger.summary.clientPaid],
                  ["Vendor paid", ledger.summary.vendorExpenses],
                  ["Other expenses", ledger.summary.otherExpenses],
                  ["Cash remaining", ledger.summary.netProfit],
                ] as const
              ).map(([label, amount]) => (
                <div key={label}>
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd
                    className={`mt-1 text-xl font-semibold tabular-nums sm:text-2xl ${
                      label === "Cash remaining"
                        ? Number(amount) < 0
                          ? "text-error"
                          : "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {formatCurrency(Number(amount))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-muted">
              Cash remaining = client received − vendor paid − other expenses.
            </p>
          </section>

          <section className="space-y-5" aria-label="Payments received">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Payments received
              </h3>
              <p className="mt-1 text-sm text-muted">
                Allocate vendor payments and other expenses inside each payment
                so you can see what remains from money received.
              </p>
            </div>

            {!receipts.length ? (
              <div className="border border-dashed border-border px-4 py-6 text-sm">
                <p className="text-muted">
                  No client payments recorded for this order yet. Record a
                  payment-in before allocating spend.
                </p>
                <Link
                  href={`/orders/${selectedOrderId}/finance`}
                  className="mt-2 inline-flex min-h-11 items-center font-medium text-primary underline"
                >
                  Record client payment
                </Link>
              </div>
            ) : (
              <ul className="space-y-5">
                {receipts.map((receipt) => {
                  const vendorSpend = ledger.vendorPayments.filter(
                    (payment) => payment.orderPaymentId === receipt.id,
                  );
                  const otherSpend = [...receipt.expenses].sort(
                    (a, b) =>
                      b.date.localeCompare(a.date) || b.id - a.id,
                  );
                  const allocated =
                    vendorSpend.reduce((sum, item) => sum + item.amount, 0) +
                    otherSpend.reduce((sum, item) => sum + item.amount, 0);
                  const remaining = receipt.amount - allocated;
                  const formOpen =
                    activeForm?.paymentId === receipt.id ? activeForm.kind : null;

                  return (
                    <li
                      key={receipt.id}
                      className="overflow-hidden rounded-xl border border-border"
                    >
                      <div className="border-b border-border bg-surface/40 px-4 py-4 sm:px-5 sm:py-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex size-8 items-center justify-center rounded-full bg-success-soft text-success">
                                <IndianRupee className="size-4" aria-hidden />
                              </span>
                              <div>
                                <p className="text-lg font-semibold tabular-nums text-foreground">
                                  {formatCurrency(receipt.amount)} received
                                </p>
                                <p className="text-sm text-muted">
                                  {displayDate(receipt.date)}
                                  {receipt.notes ? ` · ${receipt.notes}` : ""}
                                </p>
                              </div>
                            </div>
                          </div>
                          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-right sm:grid-cols-3">
                            <div>
                              <dt className="text-xs text-muted">Allocated</dt>
                              <dd className="text-sm font-semibold tabular-nums text-foreground">
                                {formatCurrency(allocated)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted">Remaining</dt>
                              <dd
                                className={`text-sm font-semibold tabular-nums ${
                                  remaining < 0
                                    ? "text-error"
                                    : "text-primary"
                                }`}
                              >
                                {formatCurrency(remaining)}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      <div className="grid gap-0 lg:grid-cols-2">
                        <div className="border-b border-border px-4 py-4 sm:px-5 lg:border-r lg:border-b-0">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-foreground">
                              Vendor payments
                            </h4>
                            {!formOpen && vendors.length > 0 ? (
                              <button
                                type="button"
                                className={quietButton}
                                disabled={isSaving}
                                onClick={() => openForm(receipt.id, "vendor")}
                              >
                                <Plus className="size-4" aria-hidden />
                                Add
                              </button>
                            ) : null}
                          </div>

                          {formOpen === "vendor" ? (
                            <EntryForm
                              kind="vendor"
                              linkedVendors={ledger.linkedVendors}
                              otherVendors={otherVendors}
                              entryError={entryError}
                              isSaving={isSaving}
                              onCancel={closeForm}
                              onSubmit={addEntry}
                            />
                          ) : null}

                          {vendors.length === 0 ? (
                            <p className="mt-3 text-sm text-muted">
                              Add a vendor in{" "}
                              <Link
                                className="font-medium text-primary underline"
                                href="/vendors"
                              >
                                Vendors
                              </Link>{" "}
                              to record a payment.
                            </p>
                          ) : null}

                          {vendorSpend.length ? (
                            <ul className="mt-3 divide-y divide-border">
                              {vendorSpend.map((payment) => (
                                <li
                                  key={payment.id}
                                  className="flex items-start justify-between gap-3 py-3"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">
                                      {payment.vendorName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted">
                                      {displayDate(payment.date)}
                                      {payment.notes
                                        ? ` · ${payment.notes}`
                                        : ""}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                                    {formatCurrency(payment.amount)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : !formOpen || formOpen !== "vendor" ? (
                            <p className="mt-3 text-sm text-muted">
                              No vendor payments from this receipt yet.
                            </p>
                          ) : null}
                        </div>

                        <div className="px-4 py-4 sm:px-5">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-foreground">
                              Other expenses
                            </h4>
                            {!formOpen ? (
                              <button
                                type="button"
                                className={quietButton}
                                disabled={isSaving}
                                onClick={() => openForm(receipt.id, "expense")}
                              >
                                <Plus className="size-4" aria-hidden />
                                Add
                              </button>
                            ) : null}
                          </div>

                          {formOpen === "expense" ? (
                            <EntryForm
                              kind="expense"
                              linkedVendors={ledger.linkedVendors}
                              otherVendors={otherVendors}
                              entryError={entryError}
                              isSaving={isSaving}
                              onCancel={closeForm}
                              onSubmit={addEntry}
                            />
                          ) : null}

                          {otherSpend.length ? (
                            <ul className="mt-3 divide-y divide-border">
                              {otherSpend.map((expense) => (
                                <li key={expense.id} className="py-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-medium text-foreground">
                                        {expense.description}
                                      </p>
                                      <p className="mt-0.5 text-xs text-muted">
                                        {displayDate(expense.date)}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                      <span className="text-sm font-semibold tabular-nums text-foreground">
                                        {formatCurrency(expense.amount)}
                                      </span>
                                      <button
                                        type="button"
                                        aria-label={`Remove expense: ${expense.description}`}
                                        disabled={isSaving}
                                        onClick={() =>
                                          setExpenseToRemove(expense.id)
                                        }
                                        className="inline-flex size-10 touch-manipulation items-center justify-center rounded-lg text-muted hover:bg-error-soft hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                      >
                                        <Trash2
                                          className="size-4"
                                          aria-hidden
                                        />
                                      </button>
                                    </div>
                                  </div>
                                  {expenseToRemove === expense.id ? (
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                      <p className="mr-auto text-sm text-foreground">
                                        Remove this expense?
                                      </p>
                                      <button
                                        type="button"
                                        disabled={isSaving}
                                        className={secondaryButton}
                                        onClick={() => setExpenseToRemove(null)}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isSaving}
                                        className="min-h-12 rounded-lg bg-error px-4 text-sm font-semibold text-white"
                                        onClick={() =>
                                          removeExpense(expense.id)
                                        }
                                      >
                                        {isSaving
                                          ? "Removing…"
                                          : "Remove expense"}
                                      </button>
                                    </div>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          ) : !formOpen || formOpen !== "expense" ? (
                            <p className="mt-3 text-sm text-muted">
                              No other expenses from this receipt yet.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {unallocatedVendorPayments.length ? (
            <section
              aria-label="Unallocated vendor payments"
              className="space-y-3 border-t border-border pt-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Unallocated vendor payments
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Older vendor payments recorded for this order before payment-in
                  allocation. New entries should be added under a payment above.
                </p>
              </div>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {unallocatedVendorPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {payment.vendorName}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {displayDate(payment.date)}
                        {payment.notes ? ` · ${payment.notes}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(payment.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {mounted && pickerOpen
        ? createPortal(
            <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
              <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0 bg-[oklch(0.22_0.02_175/0.45)]"
                onClick={closeOrderPicker}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={searchTitleId}
                className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background text-foreground sm:rounded-xl"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              >
                <div className="shrink-0 border-b border-border px-4 pt-4 pb-3 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2
                        id={searchTitleId}
                        className="text-lg font-semibold text-foreground"
                      >
                        Find an order
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        Search by order ID, customer, venue, or date.
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Close"
                      onClick={closeOrderPicker}
                      className="inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-5" aria-hidden />
                    </button>
                  </div>
                  <label className="relative mt-4 block">
                    <span className="sr-only">Search orders</span>
                    <Search
                      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                      aria-hidden
                    />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={orderQuery}
                      onChange={(event) => setOrderQuery(event.target.value)}
                      placeholder="ORD-12, customer, venue…"
                      autoComplete="off"
                      className="min-h-12 w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-10 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                    {orderQuery.trim() ? (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setOrderQuery("")}
                        className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    ) : null}
                  </label>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {filteredOrders.length === 0 ? (
                    <div className="flex items-center gap-3 px-5 py-8 text-sm text-muted">
                      <ReceiptText className="size-5 shrink-0" aria-hidden />
                      <p>
                        {orders.length === 0
                          ? "No orders yet. Create an order first."
                          : "No orders match that search."}
                      </p>
                    </div>
                  ) : (
                    <ul role="listbox" aria-labelledby={searchTitleId}>
                      {filteredOrders.map((order) => {
                        const selected = order.id === selectedOrderId;
                        return (
                          <li
                            key={order.id}
                            role="option"
                            aria-selected={selected}
                          >
                            <button
                              type="button"
                              onClick={() => selectOrder(order.id)}
                              className={`flex w-full min-h-14 touch-manipulation flex-col items-start gap-0.5 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5 ${
                                selected ? "bg-primary-soft" : ""
                              }`}
                            >
                              <span className="font-semibold text-foreground">
                                {order.orderId}
                              </span>
                              <span className="text-sm text-muted">
                                {[
                                  displayDate(order.date),
                                  order.venue,
                                  order.customerName,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function EntryForm({
  kind,
  linkedVendors,
  otherVendors,
  entryError,
  isSaving,
  onCancel,
  onSubmit,
}: {
  kind: EntryFormKind;
  linkedVendors: VendorDropdownItem[];
  otherVendors: VendorDropdownItem[];
  entryError: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const isVendor = kind === "vendor";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 rounded-lg border border-border bg-background p-3 sm:p-4"
    >
      <fieldset
        disabled={isSaving}
        className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {isVendor ? (
          <>
            <label className="block min-w-0 sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium">Vendor</span>
              <select name="vendorId" required defaultValue="" className={fieldClass}>
                <option value="" disabled>
                  Choose a vendor
                </option>
                {linkedVendors.length ? (
                  <optgroup label="Order vendors">
                    {linkedVendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                {otherVendors.length ? (
                  <optgroup label="Other vendors">
                    {otherVendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            </label>
            <label className="block min-w-0 sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium">
                Notes (optional)
              </span>
              <input
                name="notes"
                maxLength={240}
                placeholder="e.g. Advance for vegetables"
                className={fieldClass}
              />
            </label>
          </>
        ) : (
          <label className="block min-w-0 sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium">Description</span>
            <input
              name="description"
              required
              maxLength={240}
              placeholder="e.g. Transport or labour"
              className={fieldClass}
            />
          </label>
        )}
        <label className="block min-w-0">
          <span className="mb-1.5 block text-sm font-medium">Amount (₹)</span>
          <input
            name="amount"
            type="number"
            inputMode="numeric"
            min="1"
            max="2147483647"
            step="1"
            required
            placeholder="0"
            className={`${fieldClass} tabular-nums`}
          />
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-sm font-medium">Date</span>
          <input
            name="date"
            type="date"
            defaultValue={today()}
            required
            className={fieldClass}
          />
        </label>
      </fieldset>
      {entryError ? (
        <p role="alert" className="mt-3 text-sm text-error">
          {entryError}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className={secondaryButton}
          disabled={isSaving}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className={primaryButton} disabled={isSaving}>
          {isSaving
            ? "Saving…"
            : isVendor
              ? "Save vendor payment"
              : "Save expense"}
        </button>
      </div>
    </form>
  );
}
