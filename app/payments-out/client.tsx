"use client";

import { useState } from "react";
import type { OrderWithVendorPayments } from "./actions";
import { VendorPaymentManager } from "@/components/payments-out/vendor-payment-manager";
import { formatCurrency } from "@/components/payments/payment-badges";

export function PaymentsOutClient({ orders }: { orders: OrderWithVendorPayments[] }) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithVendorPayments | null>(null);

  // Filter out orders that don't have any vendors
  const ordersWithVendors = orders.filter(o => o.vendors.length > 0);

  return (
    <>
      <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-background">
        <ul className="divide-y divide-border">
          {ordersWithVendors.length === 0 ? (
            <li className="p-8 text-center text-muted">No orders with assigned vendors found.</li>
          ) : (
            ordersWithVendors.map((order) => (
              <li key={order.id}>
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left p-4 hover:bg-surface transition-colors focus:outline-none focus:bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-lg">{order.orderId}</p>
                    <p className="text-sm text-muted mt-0.5 truncate">{order.venue} · {order.date}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {order.vendors.map(v => (
                        <span key={v.vendorId} className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {v.vendorName}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start sm:items-end shrink-0 gap-1 mt-2 sm:mt-0">
                    <p className="text-xs text-muted uppercase tracking-wider font-semibold">Total Paid Out</p>
                    <p className="font-bold text-foreground text-lg">
                      {formatCurrency(order.totalPaidOut)}
                    </p>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {selectedOrder && (
        <VendorPaymentManager 
          order={orders.find(o => o.id === selectedOrder.id) || selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </>
  );
}
