"use client";

import { useState, useMemo } from "react";
import type { OrderWithBalance } from "./actions";
import { PaymentManager } from "@/components/payments/payment-manager";
import { StatusBadge, formatCurrency } from "@/components/payments/payment-badges";

export function PaymentsClient({ orders }: { orders: OrderWithBalance[] }) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithBalance | null>(null);
  const [filter, setFilter] = useState<"All" | "Pending" | "Partial" | "Cleared" | "Waived">("All");

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filter === "Cleared") {
      result = result.filter(o => o.status === "Cleared" || o.status === "Waived");
    } else if (filter === "Pending") {
      result = result.filter(o => o.status === "Pending" || o.status === "Partial");
    } else if (filter !== "All") {
      result = result.filter(o => o.status === filter);
    }
    
    // Sort logic: Unsettled (Pending, Partial) first, then by date descending
    return result.sort((a, b) => {
      const aNeedsPayment = a.status === "Pending" || a.status === "Partial";
      const bNeedsPayment = b.status === "Pending" || b.status === "Partial";
      
      if (aNeedsPayment && !bNeedsPayment) return -1;
      if (!aNeedsPayment && bNeedsPayment) return 1;
      
      return new Date(b.date).getTime() - new Date(a.date).getTime();
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
                    <p className="font-semibold text-foreground text-lg">{order.orderId}</p>
                    <p className="text-sm text-muted mt-0.5 truncate">{order.venue} · {order.date}</p>
                    {order.discount && <p className="text-xs text-purple-600 mt-1">Discount applied: {order.discount}</p>}
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <p className="font-medium text-foreground">
                      Total: {order.effectiveTotal !== null ? formatCurrency(order.effectiveTotal) : "---"}
                    </p>
                    <StatusBadge status={order.status} />
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
