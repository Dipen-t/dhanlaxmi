"use client";

import { CalendarDays, LayoutGrid, List, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { OrderRecord } from "@/app/orders/actions";
import { FloatingAddButton } from "@/components/floating-add-button";
import { OrderCalendar } from "@/components/orders/order-calendar";
import { OrderGrid } from "@/components/orders/order-grid";
import { OrderList } from "@/components/orders/order-list";

type ViewMode = "grid" | "list" | "calendar";

type OrdersViewProps = {
  orders: OrderRecord[];
};

export function OrdersView({ orders }: OrdersViewProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("orders-view");
    if (stored === "grid" || stored === "list" || stored === "calendar") {
      // The saved preference only exists in the browser after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(stored);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    const normalized = query.trim().toLowerCase();
    
    if (normalized) {
      result = orders.filter((order) => {
        const haystack = [
          order.orderId,
          order.venue,
          order.mealType,
          order.date,
          String(order.numberOfPersons),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalized);
      });
    }

    return [...result].sort((a, b) => {
      if (a.isPaymentAmount === b.isPaymentAmount) return 0;
      return a.isPaymentAmount ? 1 : -1;
    });
  }, [orders, query]);

  function setViewMode(mode: ViewMode) {
    setView(mode);
    localStorage.setItem("orders-view", mode);
  }

  function openCreate() {
    router.push("/orders/new");
  }

  function openEdit(order: OrderRecord) {
    router.push(`/orders/${order.id}/edit`);
  }

  function openFinance(order: OrderRecord) {
    router.push(`/orders/${order.id}/finance`);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search orders</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, venue, meal, or date"
              autoComplete="off"
              className="min-h-11 w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-10 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
            {hasQuery ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
          </label>

          <div
            className="inline-flex shrink-0 rounded-lg border border-border p-1"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              aria-pressed={view === "calendar"}
              onClick={() => setViewMode("calendar")}
              title="Calendar view"
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                view === "calendar"
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">Calendar view</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setViewMode("list")}
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                view === "list"
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <List className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">List view</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setViewMode("grid")}
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                view === "grid"
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">Grid view</span>
            </button>
          </div>
        </div>

        {orders.length > 0 ? (
          <p className="mt-2.5 text-sm text-muted">
            {hasQuery ? (
              <>
                {filteredOrders.length} match
                {filteredOrders.length === 1 ? "" : "es"}
              </>
            ) : (
              <>
                {orders.length} order{orders.length === 1 ? "" : "s"}
              </>
            )}
          </p>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">No orders yet</p>
          <p className="mt-1 text-sm text-muted">
            Tap the add button to log your first catering order.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-base font-medium text-foreground">No matches</p>
          <p className="mt-1 text-sm text-muted">
            Nothing found for &ldquo;{query.trim()}&rdquo;. Try another ID,
            venue, or meal.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear search
          </button>
        </div>
      ) : view === "calendar" ? (
        <OrderCalendar orders={filteredOrders} onEdit={openEdit} onFinance={openFinance} />
      ) : view === "grid" ? (
        <OrderGrid orders={filteredOrders} onEdit={openEdit} onFinance={openFinance} />
      ) : (
        <OrderList orders={filteredOrders} onEdit={openEdit} onFinance={openFinance} />
      )}

      <FloatingAddButton onClick={openCreate} label="Add order" />
    </>
  );
}
