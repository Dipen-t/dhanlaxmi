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
import { ExpenseEntryActions } from "@/components/expenses/entry-actions";
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
  createOrderSpend,
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

export function ExpensesClient({
  orders,
  vendors,
  initialOrderId,
}: ExpensesClientProps) {
  const router = useRouter();
  const searchTitleId = useId();
  const entryTitleId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const entryDialogRef = useRef<HTMLDialogElement>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<number | "">(
    initialOrderId ?? "",
  );
  const [ledger, setLedger] = useState<OrderExpenseLedger | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [orderQuery, setOrderQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [awaitingLedger, setAwaitingLedger] = useState(initialOrderId != null);
  const selectedRef = useRef<number | "">(initialOrderId ?? "");
  const requestVersion = useRef(0);
  const entrySavingRef = useRef(false);

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
  }, [pickerOpen]);

  useEffect(() => {
    const dialog = entryDialogRef.current;
    if (!dialog || !entryOpen || dialog.open) return;
    dialog.showModal();
  }, [entryOpen]);

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

    syncUrl(id);
    closeOrderPicker();
    closeForm();
  }

  function clearOrder() {
    selectedRef.current = "";
    requestVersion.current++;
    setSelectedOrderId("");
    setLedger(null);
    setAwaitingLedger(false);
    setLoadError(null);

    syncUrl("");
    closeForm();
  }

  function openForm() {
    setEntryOpen(true);
    setEntryError(null);
  }

  function closeForm() {
    if (entryDialogRef.current?.open) {
      entryDialogRef.current.close();
      return;
    }
    setEntryOpen(false);
    setEntryError(null);
  }

  function handleEntryDialogClose() {
    setEntryOpen(false);
    setEntryError(null);
  }

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedOrderId === "" || entrySavingRef.current) return;
    const orderId = selectedOrderId;
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("orderId", String(orderId));
    setEntryError(null);
    entrySavingRef.current = true;
    startSaving(async () => {
      try {
        const result = await createOrderSpend(data);
        if ("error" in result && result.error) {
          setEntryError(result.error);
          return;
        }
        form.reset();
        toast.success("Expenses recorded");
        await refreshLedger(orderId);
        closeForm();
      } catch {
        setEntryError("Could not save these entries. Please try again.");
      } finally {
        entrySavingRef.current = false;
      }
    });
  }

  const activeOrderId = ledger?.order.id ?? 0;
  const receipts = ledger?.payments.filter((payment) => !payment.isWaived) ?? [];
  const vendorSpend = ledger?.vendorPayments ?? [];
  const otherSpend = ledger?.otherExpenses ?? [];
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
              Search by order ID, customer, venue, or date. Then spend from the
              total amount received.
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
                Clear selection
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
              Cash remaining = total received − all vendor payments − all other
              expenses.
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Spend</h3>
              <p className="mt-1 text-sm text-muted">
                Add vendor payments and other expenses together from the total
                received.
              </p>
            </div>
            <button
              type="button"
              className={primaryButton}
              disabled={isSaving}
              onClick={openForm}
            >
              <Plus className="size-4" aria-hidden />
              Add expenses
            </button>
          </div>

          <section className="space-y-3" aria-label="Payments received">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Payments received
              </h3>
              <p className="mt-1 text-sm text-muted">
                Money in from the client. Spend is not tied to a single payment.
              </p>
            </div>
            {!receipts.length ? (
              <div className="border border-dashed border-border px-4 py-6 text-sm">
                <p className="text-muted">
                  No client payments recorded yet. You can still add expenses;
                  cash remaining will go negative until payments are recorded.
                </p>
                <Link
                  href={`/orders/${selectedOrderId}/finance`}
                  className="mt-2 inline-flex min-h-11 items-center font-medium text-primary underline"
                >
                  Record client payment
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {receipts.map((receipt) => (
                  <li
                    key={receipt.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-success-soft text-success">
                        <IndianRupee className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(receipt.amount)}
                        </p>
                        <p className="text-xs text-muted">
                          {displayDate(receipt.date)}
                          {receipt.notes ? ` · ${receipt.notes}` : ""}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2" aria-label="Spend ledger">
            <div className="rounded-xl border border-border">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <h4 className="text-sm font-semibold text-foreground">
                  Vendor payments
                </h4>
              </div>
              <div className="px-4 py-3 sm:px-5">
                {vendors.length === 0 ? (
                  <p className="text-sm text-muted">
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
                  <ul className="divide-y divide-border">
                    {vendorSpend.map((payment) => (
                      <li
                        key={payment.id}
                        className="flex flex-wrap items-start justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            <Link
                              href={`/vendors/${payment.vendorId}/finance`}
                              className="inline-flex min-h-11 items-center text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {payment.vendorName}
                            </Link>
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {displayDate(payment.date)}
                            {payment.notes ? ` · ${payment.notes}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(payment.amount)}
                          </span>
                          <ExpenseEntryActions
                            orderId={activeOrderId}
                            kind="vendor"
                            entry={payment}
                            vendors={vendors}
                            onChanged={() => refreshLedger(activeOrderId)}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No vendor payments yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border">
              <div className="border-b border-border px-4 py-3 sm:px-5">
                <h4 className="text-sm font-semibold text-foreground">
                  Other expenses
                </h4>
              </div>
              <div className="px-4 py-3 sm:px-5">
                {otherSpend.length ? (
                  <ul className="divide-y divide-border">
                    {otherSpend.map((expense) => (
                      <li key={expense.id} className="py-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-foreground">
                              {expense.description}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {displayDate(expense.date)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-1">
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {formatCurrency(expense.amount)}
                            </span>
                            <ExpenseEntryActions
                              orderId={activeOrderId}
                              kind="expense"
                              entry={expense}
                              vendors={vendors}
                              onChanged={() => refreshLedger(activeOrderId)}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No other expenses yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <dialog
        ref={entryDialogRef}
        className="app-dialog app-dialog-wide"
        aria-labelledby={entryTitleId}
        onClose={handleEntryDialogClose}
        onCancel={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
      >
        {entryOpen ? (
          <SpendForm
            key={selectedOrderId || "spend"}
            titleId={entryTitleId}
            receivedLabel={
              ledger
                ? `Total received ${formatCurrency(ledger.summary.clientPaid)} · remaining ${formatCurrency(ledger.summary.netProfit)}`
                : null
            }
            vendors={vendors}
            entryError={entryError}
            isSaving={isSaving}
            onCancel={closeForm}
            onSubmit={addEntry}
          />
        ) : null}
      </dialog>

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
                  <div className="flex flex-wrap items-start justify-between gap-3">
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

function SpendForm({
  titleId,
  receivedLabel,
  vendors,
  entryError,
  isSaving,
  onCancel,
  onSubmit,
}: {
  titleId: string;
  receivedLabel: string | null;
  vendors: VendorDropdownItem[];
  entryError: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [vendorAmounts, setVendorAmounts] = useState<Record<number, string>>({});
  const [expenses, setExpenses] = useState([
    { id: 0, description: "", amount: "" },
  ]);
  const nextExpenseId = useRef(1);
  const vendorTotal = Object.values(vendorAmounts).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
  const otherTotal = expenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0,
  );
  const total = vendorTotal + otherTotal;
  const vendorFilled = Object.values(vendorAmounts).filter((amount) =>
    amount.trim(),
  ).length;
  const otherFilled = expenses.filter(
    (expense) => expense.description.trim() || expense.amount.trim(),
  ).length;
  const filledCount = vendorFilled + otherFilled;

  function updateExpense(
    id: number,
    updates: { description?: string; amount?: string },
  ) {
    setExpenses((current) =>
      current.map((expense) =>
        expense.id === id ? { ...expense, ...updates } : expense,
      ),
    );
  }

  function addExpenseRow() {
    const id = nextExpenseId.current++;
    setExpenses((current) => [
      ...current,
      { id, description: "", amount: "" },
    ]);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{ maxHeight: "inherit" }}
    >
      <div className="shrink-0 px-5 pt-5 pb-4">
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          Add expenses
        </h2>
        {receivedLabel ? (
          <p className="mt-1 text-sm text-muted">{receivedLabel}</p>
        ) : null}
      </div>

      <div className="app-dialog-body min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
        <fieldset disabled={isSaving} className="min-w-0 space-y-6">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Date
            </span>
            <input
              name="date"
              type="date"
              defaultValue={today()}
              required
              className={fieldClass}
            />
          </label>

          {vendors.length > 0 ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Vendor payments
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Enter amounts for vendors you paid. Leave the rest empty.
                </p>
              </div>
              <label className="block min-w-0">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Notes for vendor payments (optional)
                </span>
                <input
                  name="notes"
                  maxLength={240}
                  placeholder="e.g. Advance for supplies"
                  className={fieldClass}
                />
              </label>
              <div className="divide-y divide-border rounded-lg border border-border">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="px-3 py-3">
                    <input type="hidden" name="vendorId" value={vendor.id} />
                    <label className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,10rem)] items-center gap-3">
                      <span className="break-words text-sm font-medium text-foreground">
                        {vendor.name}
                      </span>
                      <input
                        name="amount"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="2147483647"
                        step="1"
                        aria-label={`Amount paid to ${vendor.name}`}
                        value={vendorAmounts[vendor.id] ?? ""}
                        onChange={(event) =>
                          setVendorAmounts((current) => ({
                            ...current,
                            [vendor.id]: event.target.value,
                          }))
                        }
                        placeholder="Amount (₹)"
                        className={`${fieldClass} tabular-nums`}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Other expenses
              </h3>
              <p className="mt-1 text-sm text-muted">
                Transport, labour, or anything else from this order&apos;s cash.
              </p>
            </div>
            {expenses.map((expense, index) => {
              const required = Boolean(
                expense.description.trim() || expense.amount.trim(),
              );
              return (
                <div
                  key={expense.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,9rem)_2.5rem] items-end gap-2"
                >
                  <label className="block min-w-0">
                    <span className="mb-1.5 block text-sm font-medium text-foreground">
                      Description
                    </span>
                    <input
                      name="description"
                      required={required}
                      maxLength={240}
                      value={expense.description}
                      onChange={(event) =>
                        updateExpense(expense.id, {
                          description: event.target.value,
                        })
                      }
                      aria-label={`Expense ${index + 1} description`}
                      placeholder="Transport or labour"
                      className={fieldClass}
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1.5 block text-sm font-medium text-foreground">
                      Amount (₹)
                    </span>
                    <input
                      name="expenseAmount"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="2147483647"
                      step="1"
                      required={required}
                      value={expense.amount}
                      onChange={(event) =>
                        updateExpense(expense.id, {
                          amount: event.target.value,
                        })
                      }
                      aria-label={`Expense ${index + 1} amount`}
                      placeholder="0"
                      className={`${fieldClass} tabular-nums`}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={expenses.length === 1}
                    onClick={() =>
                      setExpenses((current) =>
                        current.filter((row) => row.id !== expense.id),
                      )
                    }
                    aria-label={`Remove expense ${index + 1}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-lg text-muted hover:bg-error-soft hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={addExpenseRow} className={quietButton}>
              <Plus className="size-4" aria-hidden /> Add more
            </button>
          </div>
        </fieldset>
      </div>

      {entryError ? (
        <p role="alert" className="shrink-0 px-5 pb-4 text-sm text-error">
          {entryError}
        </p>
      ) : null}
      <div className="relative shrink-0 border-t border-border bg-background px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">
            {filledCount} entr{filledCount === 1 ? "y" : "ies"}
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            Total {formatCurrency(total)}
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={secondaryButton}
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={primaryButton}
            disabled={isSaving || filledCount === 0}
          >
            {isSaving ? "Saving…" : "Save all"}
          </button>
        </div>
      </div>
    </form>
  );
}
