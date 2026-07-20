"use client";

import { useState, useMemo } from "react";
import type { OrderWithVendorPayments } from "./actions";
import { VendorPaymentManager } from "@/components/payments-out/vendor-payment-manager";
import { formatCurrency } from "@/components/payments/payment-badges";
import { Search, X } from "lucide-react";

export function PaymentsOutClient({ orders }: { orders: OrderWithVendorPayments[] }) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithVendorPayments | null>(null);
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vendorFilter, setVendorFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<"default" | "date-desc" | "date-asc">("default");

  const isDateInRange = (dateStr: string) => {
    if (!fromDate && !toDate) return true;
    if (!dateStr) return true;
    const [d, m, y] = dateStr.split("/");
    if (!d || !m || !y) return true;
    const recordDate = `${y}-${m}-${d}`;
    if (fromDate && recordDate < fromDate) return false;
    if (toDate && recordDate > toDate) return false;
    return true;
  };
  
  // Get unique vendors for the filter dropdown
  const allVendors = useMemo(() => {
    const vendorsMap = new Map<number, string>();
    orders.forEach(o => {
      o.vendors.forEach(v => {
        vendorsMap.set(v.vendorId, v.vendorName);
      });
    });
    return Array.from(vendorsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [orders]);

  const ordersWithVendors = useMemo(() => {
    let result = orders.filter(o => o.vendors.length > 0 && isDateInRange(o.date));
    
    if (vendorFilter !== "All") {
      result = result.filter(o => o.vendors.some(v => v.vendorId === Number(vendorFilter)));
    }

    const normalized = query.trim().toLowerCase();
    if (normalized) {
      result = result.filter(o => {
        const vendorNames = o.vendors.map(v => v.vendorName).join(" ");
        return [o.orderId, o.customerName, o.venue, o.date, vendorNames, o.customerPhone]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      });
    }

    return result.sort((a, b) => {
      if (sortOrder === "date-desc" || sortOrder === "date-asc") {
        const [dA, mA, yA] = a.date.split("/");
        const [dB, mB, yB] = b.date.split("/");
        const dateA = new Date(`${yA}-${mA}-${dA}`).getTime();
        const dateB = new Date(`${yB}-${mB}-${dB}`).getTime();
        return sortOrder === "date-desc" ? dateB - dateA : dateA - dateB;
      }

      const nameA = a.customerName || "Unknown Customer";
      const nameB = b.customerName || "Unknown Customer";
      return nameA.localeCompare(nameB);
    });
  }, [orders, query, fromDate, toDate, vendorFilter, sortOrder]);

  return (
    <>
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <label className="relative block flex-1 max-w-md">
          <span className="sr-only">Search vendor payments</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, customer, vendor, date..."
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
        
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
          >
            <option value="default">Sort: Customer</option>
            <option value="date-desc">Date: Newest</option>
            <option value="date-asc">Date: Oldest</option>
          </select>
          
          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
          >
            <option value="All">All Vendors</option>
            {allVendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
            title="From Date"
          />
          <span className="text-muted">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
            title="To Date"
          />
        </div>
      </div>

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
                    <p className="font-semibold text-foreground text-lg">
                      {order.customerName || "Unknown Customer"}
                    </p>
                    <p className="text-sm text-muted mt-0.5 truncate">
                      {order.orderId} {order.customerPhone ? `· ${order.customerPhone}` : ""}
                    </p>
                    <p className="text-sm text-muted mt-0.5 truncate">
                      {order.venue} · {order.date}
                    </p>
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
                  
                  <div className="hidden sm:flex items-center justify-center shrink-0 ml-2 text-muted-foreground/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5"><path d="m9 18 6-6-6-6"/></svg>
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
