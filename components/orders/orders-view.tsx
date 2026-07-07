"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { OrderRecord } from "@/app/orders/actions";
import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import { FloatingAddButton } from "@/components/floating-add-button";
import { OrderDialog } from "@/components/orders/order-dialog";
import { OrderGrid } from "@/components/orders/order-grid";
import { OrderList } from "@/components/orders/order-list";

type ViewMode = "grid" | "list";

type OrdersViewProps = {
  orders: OrderRecord[];
  suggestedOrderId: string;
  rawMaterials: MaterialWithVendor[];
};

export function OrdersView({ orders, suggestedOrderId, rawMaterials }: OrdersViewProps) {
  const [view, setView] = useState<ViewMode>("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [query, setQuery] = useState("");
  const [nextOrderId, setNextOrderId] = useState(suggestedOrderId);

  useEffect(() => {
    const stored = localStorage.getItem("orders-view");
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
  }, []);

  useEffect(() => {
    setNextOrderId(suggestedOrderId);
  }, [suggestedOrderId]);

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orders;

    return orders.filter((order) => {
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
  }, [orders, query]);

  function setViewMode(mode: ViewMode) {
    setView(mode);
    localStorage.setItem("orders-view", mode);
  }

  function openCreate() {
    setEditingOrder(null);
    setDialogOpen(true);
  }

  function openEdit(order: OrderRecord) {
    setEditingOrder(order);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingOrder(null);
  }

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <label className="relative block min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search orders"
            className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </label>

        <div
          className="inline-flex shrink-0 rounded-lg border border-border p-1"
          role="group"
          aria-label="View mode"
        >
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
        </div>
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
          <p className="text-sm text-muted">No orders match your search.</p>
        </div>
      ) : view === "grid" ? (
        <OrderGrid orders={filteredOrders} onEdit={openEdit} />
      ) : (
        <OrderList orders={filteredOrders} onEdit={openEdit} />
      )}

      <OrderDialog
        open={dialogOpen}
        order={editingOrder}
        suggestedOrderId={nextOrderId}
        rawMaterials={rawMaterials}
        onClose={closeDialog}
      />

      <FloatingAddButton onClick={openCreate} label="Add order" />
    </>
  );
}
