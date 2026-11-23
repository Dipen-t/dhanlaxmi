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
import { ExpenseEntryActions } from "@/components/expenses/entry-actions";
import {
  Plus,
  Trash2,
  Search,
  X,
  ReceiptText,
  IndianRupee,
  ArrowLeft,
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
  const orderListTitleId = useId();
  const entryTitleId = useId();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const entryDialogRef = useRef<HTMLDialogElement>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<number | "">(
    initialOrderId ?? "",
  );
  const [ledger, setLedger] = useState<OrderExpenseLedger | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<"expense" | "vendor" | null>(null);
  const [orderQuery, setOrderQuery] = useState("");
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [awaitingLedger, setAwaitingLedger] = useState(initialOrderId != null);
  const selectedRef = useRef<number | "">(initialOrderId ?? "");
  const requestVersion = useRef(0);
  const entrySavingRef = useRef(false);

  useEffect(() => {
    const dialog = entryDialogRef.current;
    if (!dialog || !entryMode || dialog.open) return;
    dialog.showModal();
  }, [entryMode]);

  useEffect(() => {
    if (selectedOrderId !== "") return;
    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [selectedOrderId]);

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

  function selectOrder(id: number) {
    selectedRef.current = id;
    requestVersion.current++;
    setSelectedOrderId(id);
    setLedger(null);
    setAwaitingLedger(true);
    setLoadError(null);
    setOrderQuery("");

    syncUrl(id);
    closeForm();
  }

  function clearOrder() {
    selectedRef.current = "";
    requestVersion.current++;
    setSelectedOrderId("");
    setLedger(null);
    setAwaitingLedger(false);
    setLoadError(null);
    setOrderQuery("");

    syncUrl("");
    closeForm();
  }

  function openForm(mode: "expense" | "vendor") {
    setEntryMode(mode);
    setEntryError(null);
  }

  function closeForm() {
    if (entryDialogRef.current?.open) {
      entryDialogRef.current.close();
      return;
    }
    setEntryMode(null);
    setEntryError(null);
  }

  function handleEntryDialogClose() {
    setEntryMode(null);
    setEntryError(null);
  }

  function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedOrderId === "" || !entryMode || entrySavingRef.current) return;
    const orderId = selectedOrderId;
    const mode = entryMode;
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
        toast.success(
          mode === "vendor"
            ? "Vendor payments recorded"
            : "Expenses recorded",
        );
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
        <section aria-labelledby={orderListTitleId} className="space-y-4">
          <div>
            <h2
              id={orderListTitleId}
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Choose an order
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tap an order to record spend from its total received.
            </p>
          </div>

          <label className="relative block max-w-xl">
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
              placeholder="Search order ID, customer, venue, date…"
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

          <div className="overflow-hidden rounded-xl border border-border">
            {filteredOrders.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-8 text-sm text-muted sm:px-5">
                <ReceiptText className="size-5 shrink-0" aria-hidden />
                <p>
                  {orders.length === 0
                    ? "No orders yet. Create an order first."
                    : "No orders match that search."}
                </p>
              </div>
            ) : (
              <ul role="listbox" aria-labelledby={orderListTitleId}>
                {filteredOrders.map((order) => (
                  <li key={order.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => selectOrder(order.id)}
                      className="flex w-full min-h-14 touch-manipulation flex-col items-start gap-0.5 border-b border-border px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
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
                ))}
              </ul>
            )}
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
            <button
              type="button"
              className={secondaryButton}
              disabled={isSaving}
              onClick={clearOrder}
            >
              <ArrowLeft className="size-4" aria-hidden />
              All orders
            </button>
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
                Choose what you paid — vendor or other cost — from total
                received.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButton}
                disabled={isSaving || vendors.length === 0}
                onClick={() => openForm("vendor")}
              >
                <Plus className="size-4" aria-hidden />
                Add vendor payment
              </button>
              <button
                type="button"
                className={primaryButton}
                disabled={isSaving}
                onClick={() => openForm("expense")}
              >
                <Plus className="size-4" aria-hidden />
                Add expense
              </button>
            </div>
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
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                <h4 className="text-sm font-semibold text-foreground">
                  Vendor payments
                </h4>
                {vendors.length > 0 ? (
                  <button
                    type="button"
                    className={quietButton}
                    disabled={isSaving}
                    onClick={() => openForm("vendor")}
                  >
                    <Plus className="size-4" aria-hidden />
                    Add
                  </button>
                ) : null}
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
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
                <h4 className="text-sm font-semibold text-foreground">
                  Other expenses
                </h4>
                <button
                  type="button"
                  className={quietButton}
                  disabled={isSaving}
                  onClick={() => openForm("expense")}
                >
                  <Plus className="size-4" aria-hidden />
                  Add
                </button>
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
        {entryMode ? (
          <SpendForm
            key={`${entryMode}-${selectedOrderId || "spend"}`}
            mode={entryMode}
            titleId={entryTitleId}
            clientPaid={ledger?.summary.clientPaid ?? 0}
            cashRemaining={ledger?.summary.netProfit ?? 0}
            vendors={vendors}
            linkedVendorIds={ledger?.linkedVendors.map((vendor) => vendor.id) ?? []}
            entryError={entryError}
            isSaving={isSaving}
            onCancel={closeForm}
            onSubmit={addEntry}
          />
        ) : null}
      </dialog>
    </div>
  );
}

const OTHER_QUICK_LABELS = ["Transport", "Labour", "Fuel", "Decoration", "Misc"];

function AmountField({
  name,
  value,
  onChange,
  ariaLabel,
  required,
  autoFocus,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative min-w-0">
      <span
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted"
        aria-hidden
      >
        ₹
      </span>
      <input
        name={name}
        type="number"
        inputMode="numeric"
        min="1"
        max="2147483647"
        step="1"
        required={required}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        className={`${fieldClass} pl-7 tabular-nums`}
      />
    </div>
  );
}

function SpendForm({
  mode,
  titleId,
  clientPaid,
  cashRemaining,
  vendors,
  linkedVendorIds,
  entryError,
  isSaving,
  onCancel,
  onSubmit,
}: {
  mode: "expense" | "vendor";
  titleId: string;
  clientPaid: number;
  cashRemaining: number;
  vendors: VendorDropdownItem[];
  linkedVendorIds: number[];
  entryError: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const isVendor = mode === "vendor";
  const [vendorAmounts, setVendorAmounts] = useState<Record<number, string>>({});
  const [vendorQuery, setVendorQuery] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showAllVendors, setShowAllVendors] = useState(false);
  const [expenses, setExpenses] = useState([
    { id: 0, description: "", amount: "" },
  ]);
  const nextExpenseId = useRef(1);
  const linkedSet = useMemo(() => new Set(linkedVendorIds), [linkedVendorIds]);

  const sortedVendors = useMemo(() => {
    return [...vendors].sort((a, b) => {
      const aLinked = linkedSet.has(a.id) ? 0 : 1;
      const bLinked = linkedSet.has(b.id) ? 0 : 1;
      if (aLinked !== bLinked) return aLinked - bLinked;
      return a.name.localeCompare(b.name);
    });
  }, [vendors, linkedSet]);

  const linkedVendors = sortedVendors.filter((vendor) => linkedSet.has(vendor.id));
  const otherVendors = sortedVendors.filter((vendor) => !linkedSet.has(vendor.id));

  const vendorQueryNorm = vendorQuery.trim().toLowerCase();
  const matchesQuery = (vendor: VendorDropdownItem) =>
    !vendorQueryNorm || vendor.name.toLowerCase().includes(vendorQueryNorm);

  const visibleLinked = linkedVendors.filter(
    (vendor) => matchesQuery(vendor) || Boolean(vendorAmounts[vendor.id]?.trim()),
  );
  const visibleOther = otherVendors.filter(
    (vendor) => matchesQuery(vendor) || Boolean(vendorAmounts[vendor.id]?.trim()),
  );
  const showOtherList =
    showAllVendors || vendorQueryNorm.length > 0 || visibleOther.some((v) => vendorAmounts[v.id]?.trim());

  const vendorTotal = Object.values(vendorAmounts).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
  const otherTotal = expenses.reduce(
    (sum, expense) => sum + (Number(expense.amount) || 0),
    0,
  );
  const total = isVendor ? vendorTotal : otherTotal;
  const remainingAfter = cashRemaining - total;
  const vendorFilled = Object.values(vendorAmounts).filter((amount) =>
    amount.trim(),
  ).length;
  const otherFilled = expenses.filter(
    (expense) => expense.description.trim() || expense.amount.trim(),
  ).length;
  const filledCount = isVendor ? vendorFilled : otherFilled;

  function setVendorAmount(vendorId: number, value: string) {
    setVendorAmounts((current) => ({ ...current, [vendorId]: value }));
  }

  function updateExpense(
    id: number,
    updates: { description?: string; amount?: string },
  ) {
    setExpenses((current) => {
      const next = current.map((expense) =>
        expense.id === id ? { ...expense, ...updates } : expense,
      );
      const last = next[next.length - 1];
      const lastFilled = Boolean(last?.description.trim() && last?.amount.trim());
      if (lastFilled) {
        const newId = nextExpenseId.current++;
        return [...next, { id: newId, description: "", amount: "" }];
      }
      return next;
    });
  }

  function addExpenseRow(description = "") {
    setExpenses((current) => {
      const blank = current.find(
        (row) => !row.description.trim() && !row.amount.trim(),
      );
      if (blank && description) {
        return current.map((row) =>
          row.id === blank.id ? { ...row, description } : row,
        );
      }
      if (blank && !description) return current;
      const id = nextExpenseId.current++;
      return [...current, { id, description, amount: "" }];
    });
  }

  function applyQuickLabel(label: string) {
    addExpenseRow(label);
  }

  function renderVendorRow(vendor: VendorDropdownItem, hint?: string) {
    const filled = Boolean(vendorAmounts[vendor.id]?.trim());
    return (
      <div
        key={vendor.id}
        className={`px-3 py-3 ${filled ? "bg-primary-soft/40" : ""}`}
      >
        <input type="hidden" name="vendorId" value={vendor.id} />
        <label className="grid grid-cols-[minmax(0,1fr)_minmax(7.5rem,9.5rem)] items-center gap-3">
          <span className="min-w-0">
            <span className="block break-words text-sm font-medium text-foreground">
              {vendor.name}
            </span>
            {hint ? (
              <span className="mt-0.5 block text-xs text-muted">{hint}</span>
            ) : null}
          </span>
          <AmountField
            name="amount"
            value={vendorAmounts[vendor.id] ?? ""}
            onChange={(value) => setVendorAmount(vendor.id, value)}
            ariaLabel={`Amount paid to ${vendor.name}`}
          />
        </label>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{ maxHeight: "inherit" }}
    >
      <div className="shrink-0 space-y-3 border-b border-border px-5 pt-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {isVendor ? "Add vendor payment" : "Add expense"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isVendor
                ? "Type amounts for vendors you paid. Empty rows are skipped."
                : "Add one or more costs from this order's cash."}
            </p>
          </div>
          <label className="block shrink-0">
            <span className="mb-1 block text-xs font-medium text-muted">Date</span>
            <input
              name="date"
              type="date"
              defaultValue={today()}
              required
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </label>
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface/50 px-3 py-2">
            <dt className="text-xs text-muted">Received</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(clientPaid)}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface/50 px-3 py-2">
            <dt className="text-xs text-muted">Cash left now</dt>
            <dd
              className={`mt-0.5 text-sm font-semibold tabular-nums ${
                cashRemaining < 0 ? "text-error" : "text-primary"
              }`}
            >
              {formatCurrency(cashRemaining)}
            </dd>
          </div>
          <div className="col-span-2 rounded-lg border border-border bg-surface/50 px-3 py-2 sm:col-span-1">
            <dt className="text-xs text-muted">After this save</dt>
            <dd
              className={`mt-0.5 text-sm font-semibold tabular-nums ${
                remainingAfter < 0 ? "text-error" : "text-foreground"
              }`}
            >
              {formatCurrency(remainingAfter)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="app-dialog-body min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        <fieldset disabled={isSaving} className="min-w-0 space-y-8">
          {isVendor && vendors.length > 0 ? (
            <section className="space-y-3" aria-label="Vendor payments">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Paid to vendors
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Find a vendor, type the rupees you paid.
                  </p>
                </div>
                {vendorFilled > 0 ? (
                  <p className="text-sm font-medium tabular-nums text-foreground">
                    {vendorFilled} · {formatCurrency(vendorTotal)}
                  </p>
                ) : null}
              </div>

              <label className="relative block">
                <span className="sr-only">Search vendors</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  type="search"
                  value={vendorQuery}
                  onChange={(event) => setVendorQuery(event.target.value)}
                  placeholder="Search vendor name…"
                  autoComplete="off"
                  className="min-h-12 w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-10 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
                {vendorQuery.trim() ? (
                  <button
                    type="button"
                    aria-label="Clear vendor search"
                    onClick={() => setVendorQuery("")}
                    className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                ) : null}
              </label>

              {visibleLinked.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    On this order
                  </p>
                  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {visibleLinked.map((vendor) =>
                      renderVendorRow(vendor, "Kitchen item vendor"),
                    )}
                  </div>
                </div>
              ) : null}

              {showOtherList ? (
                <div className="space-y-2">
                  {linkedVendors.length > 0 ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                      Other vendors
                    </p>
                  ) : null}
                  {visibleOther.length ? (
                    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                      {visibleOther.map((vendor) => renderVendorRow(vendor))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No vendors match that search.</p>
                  )}
                </div>
              ) : otherVendors.length > 0 ? (
                <button
                  type="button"
                  className={quietButton}
                  onClick={() => setShowAllVendors(true)}
                >
                  Show all {otherVendors.length} other vendors
                </button>
              ) : null}

              {vendorFilled > 0 || showNotes ? (
                <div className="space-y-2">
                  {!showNotes ? (
                    <button
                      type="button"
                      className={quietButton}
                      onClick={() => setShowNotes(true)}
                    >
                      Add a shared note for these vendor payments
                    </button>
                  ) : (
                    <label className="block min-w-0">
                      <span className="mb-1.5 block text-sm font-medium text-foreground">
                        Note for vendor payments
                      </span>
                      <input
                        name="notes"
                        maxLength={240}
                        autoFocus
                        placeholder="e.g. Paid at venue"
                        className={fieldClass}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <input type="hidden" name="notes" value="" />
              )}
            </section>
          ) : null}

          {isVendor && vendors.length === 0 ? (
            <p className="text-sm text-muted">
              Add a vendor in Vendors before recording a payment.
            </p>
          ) : null}

          {!isVendor ? (
          <section className="space-y-3" aria-label="Other expenses">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Other costs
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Transport, labour, or tap a quick label.
                </p>
              </div>
              {otherFilled > 0 ? (
                <p className="text-sm font-medium tabular-nums text-foreground">
                  {otherFilled} · {formatCurrency(otherTotal)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {OTHER_QUICK_LABELS.map((label) => {
                const used = expenses.some(
                  (expense) =>
                    expense.description.trim().toLowerCase() ===
                    label.toLowerCase(),
                );
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={used}
                    onClick={() => applyQuickLabel(label)}
                    className="inline-flex min-h-10 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {expenses.map((expense, index) => {
                const required = Boolean(
                  expense.description.trim() || expense.amount.trim(),
                );
                const isBlank =
                  !expense.description.trim() && !expense.amount.trim();
                return (
                  <div
                    key={expense.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(7rem,9rem)_2.5rem] items-center gap-2 rounded-lg border border-border px-3 py-2.5"
                  >
                    <label className="block min-w-0">
                      <span className="sr-only">
                        Expense {index + 1} description
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
                        placeholder={
                          isBlank ? "What for? e.g. Transport" : "Description"
                        }
                        className="min-h-11 w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:bg-background focus:ring-2 focus:ring-ring/30"
                      />
                    </label>
                    <AmountField
                      name="expenseAmount"
                      value={expense.amount}
                      onChange={(value) =>
                        updateExpense(expense.id, { amount: value })
                      }
                      ariaLabel={`Expense ${index + 1} amount`}
                      required={required}
                    />
                    <button
                      type="button"
                      disabled={expenses.length === 1 && isBlank}
                      onClick={() =>
                        setExpenses((current) =>
                          current.length === 1
                            ? [{ id: current[0].id, description: "", amount: "" }]
                            : current.filter((row) => row.id !== expense.id),
                        )
                      }
                      aria-label={`Remove expense ${index + 1}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg text-muted hover:bg-error-soft hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => addExpenseRow()}
              className={quietButton}
            >
              <Plus className="size-4" aria-hidden /> Add another cost
            </button>
          </section>
          ) : null}
        </fieldset>
      </div>

      {entryError ? (
        <p role="alert" className="shrink-0 px-5 pb-3 text-sm text-error">
          {entryError}
        </p>
      ) : null}
      <div className="relative shrink-0 border-t border-border bg-background px-5 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted">
            {filledCount === 0
              ? "Nothing entered yet"
              : isVendor
                ? `${vendorFilled} vendor payment${vendorFilled === 1 ? "" : "s"}`
                : `${otherFilled} expense${otherFilled === 1 ? "" : "s"}`}
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
            {isSaving
              ? "Saving…"
              : filledCount === 0
                ? "Enter an amount"
                : isVendor
                  ? `Save vendor payments ${formatCurrency(total)}`
                  : `Save expenses ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </form>
  );
}
