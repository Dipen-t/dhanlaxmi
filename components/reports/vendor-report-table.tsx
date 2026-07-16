"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/components/payments/payment-badges";
import { ChevronDown, ChevronRight, Package, ReceiptText } from "lucide-react";
import type { VendorOrderReport } from "@/app/reports/actions";

export function VendorReportTable({ reports }: { reports: VendorOrderReport[] }) {
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  const toggleOrder = (dbId: number) => {
    const newSet = new Set(expandedOrders);
    if (newSet.has(dbId)) {
      newSet.delete(dbId);
    } else {
      newSet.add(dbId);
    }
    setExpandedOrders(newSet);
  };

  return (
    <div className="w-full flex-1 overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-muted-foreground uppercase bg-surface border-b border-border sticky top-0 z-10">
          <tr>
            <th className="px-6 py-4 font-medium w-10"></th>
            <th className="px-6 py-4 font-medium">Order ID / Date</th>
            <th className="px-6 py-4 font-medium">Venue</th>
            <th className="px-6 py-4 font-medium">Vendors Involved</th>
            <th className="px-6 py-4 font-medium text-right">Total Payments</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reports.map((report) => {
            const isExpanded = expandedOrders.has(report.orderDbId);
            
            return (
              <React.Fragment key={report.orderDbId}>
                <tr 
                  className={`hover:bg-surface/50 transition-colors cursor-pointer ${isExpanded ? 'bg-surface/30' : ''}`}
                  onClick={() => toggleOrder(report.orderDbId)}
                >
                  <td className="px-6 py-4">
                    {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{report.orderId}</div>
                    <div className="text-xs text-muted-foreground">{report.date}</div>
                  </td>
                  <td className="px-6 py-4">{report.venue}</td>
                  <td className="px-6 py-4">{report.vendors.length} vendors</td>
                  <td className="px-6 py-4 font-medium text-primary text-right">
                    {formatCurrency(report.totalVendorPayments)}
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="bg-surface/10 p-0 border-b border-border">
                      <div className="px-16 py-6 space-y-6">
                        {report.vendors.length === 0 ? (
                          <div className="text-sm text-muted-foreground italic">No vendors found for this order.</div>
                        ) : (
                          report.vendors.map((v) => (
                            <div key={v.vendorId} className="bg-background rounded-lg border border-border overflow-hidden">
                              <div className="px-4 py-3 bg-surface border-b border-border flex justify-between items-center">
                                <div>
                                  <span className="font-semibold">{v.vendorName}</span>
                                  <span className="text-muted-foreground text-xs ml-2">{v.vendorPhone}</span>
                                </div>
                                <div className="text-sm font-medium">
                                  Total Paid: <span className="text-primary">{formatCurrency(v.totalPaid)}</span>
                                </div>
                              </div>
                              
                              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <Package className="size-3" />
                                    Deliveries
                                  </h4>
                                  {v.deliveries.length === 0 ? (
                                    <div className="text-xs text-muted-foreground italic">No deliveries recorded.</div>
                                  ) : (
                                    <ul className="space-y-2">
                                      {v.deliveries.map((d, i) => (
                                        <li key={i} className="text-sm flex justify-between">
                                          <span>{d.rawMaterialName}</span>
                                          <span className="text-muted-foreground">{d.unitQty} {d.unitName}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                
                                <div>
                                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <ReceiptText className="size-3" />
                                    Payments
                                  </h4>
                                  {v.payments.length === 0 ? (
                                    <div className="text-xs text-muted-foreground italic">No payments recorded.</div>
                                  ) : (
                                    <ul className="space-y-2">
                                      {v.payments.map((p, i) => (
                                        <li key={i} className="text-sm flex justify-between border-b border-border/50 pb-1 last:border-0 last:pb-0">
                                          <span>{p.date}</span>
                                          <div className="text-right">
                                            <span className="font-medium text-primary block">{formatCurrency(p.amount)}</span>
                                            {p.notes && <span className="text-[10px] text-muted-foreground block">{p.notes}</span>}
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {reports.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
