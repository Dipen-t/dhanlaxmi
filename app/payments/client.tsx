"use client";

import { useState, useMemo } from "react";
import type { OrderWithBalance } from "./actions";
import { PaymentManager } from "@/components/payments/payment-manager";
import { StatusBadge, formatCurrency } from "@/components/payments/payment-badges";
import { Search, X } from "lucide-react";

export function PaymentsClient({ orders }: { orders: OrderWithBalance[] }) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithBalance | null>(null);
  const [filter, setFilter] = useState<"All" | "Pending" | "Partial" | "Cleared" | "Waived">("All");
  const [query, setQuery] = useState("");

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filter === "Cleared") {
      result = result.filter(o => o.status === "Cleared" || o.status === "Waived");
    } else if (filter === "Pending") {
      result = result.filter(o => o.status === "Pending" || o.status === "Partial");
    } else if (filter === "Waived") {
      result = result.filter(o => o.payments.some(p => p.isWaived));
    } else if (filter !== "All") {
      result = result.filter(o => o.status === filter);
    }

    const normalized = query.trim().toLowerCase();
    if (normalized) {
      result = result.filter(o => 
        [o.orderId, o.customerName, o.venue, o.date, o.customerPhone]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      );
    }
    
    // Sort logic: Unsettled (Pending, Partial) first, then by customer name
    return result.sort((a, b) => {
      const aNeedsPayment = a.status === "Pending" || a.status === "Partial";
      const bNeedsPayment = b.status === "Pending" || b.status === "Partial";
      
      if (aNeedsPayment && !bNeedsPayment) return -1;
      if (!aNeedsPayment && bNeedsPayment) return 1;
      
      const nameA = a.customerName || "Unknown Customer";
      const nameB = b.customerName || "Unknown Customer";
      return nameA.localeCompare(nameB);
    });
  }, [orders, filter]);

  return (
    <>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {["All", "Pending", "Partial", "Cleared", "Waived"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f 
                ? "bg-primary text-primary-foreground" 
                : "bg-surface text-foreground border border-border hover:border-primary/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <label className="relative block w-full max-w-md">
          <span className="sr-only">Search payments</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, name, date..."
            autoComplete="off"
            className="min-h-11 w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-10 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          )}
        </label>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-background">
        <ul className="divide-y divide-border">
          {filteredOrders.length === 0 ? (
            <li className="p-8 text-center text-muted">No orders found for this filter.</li>
          ) : (
            filteredOrders.map((order) => (
              <li key={order.id}>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left p-4 hover:bg-surface transition-colors focus:outline-none focus:bg-surface flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-lg">
                      {order.customerName || "Unknown Customer"}
                    </p>
                    <p className="text-sm text-muted mt-0.5 truncate">
                      {order.orderId} {order.customerPhone ? `· ${order.customerPhone}` : ""}
                    </p>
                    <p className="text-sm text-muted mt-0.5 truncate">
                      {order.venue} · {order.date}
                    </p>
                    {order.discount && <p className="text-xs text-info mt-1">Discount applied: {order.discount}</p>}
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <p className="font-medium text-foreground">
                      Total: {order.effectiveTotal !== null ? formatCurrency(order.effectiveTotal) : "---"}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                  
                  <div className="flex items-center justify-center shrink-0 ml-2 text-muted-foreground/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {selectedOrder && (
        <PaymentManager 
          order={orders.find(o => o.id === selectedOrder.id) || selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </>
  );
}
