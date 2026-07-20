"use client";

import type { EventProfitability } from "@/app/reports/actions";
import { formatCurrency } from "@/components/payments/payment-badges";

export function EventProfitabilityTable({ reports }: { reports: EventProfitability[] }) {
  if (reports.length === 0) {
    return (
      <div className="p-12 text-center text-muted">
        No order data available yet.
      </div>
    );
  }

  return (
    <div className="w-full flex-1 overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface/50 text-muted uppercase text-xs sticky top-0 border-b border-border">
          <tr>
            <th className="min-w-[200px] px-4 py-4 font-semibold whitespace-nowrap">Customer</th>
            <th className="min-w-[120px] px-4 py-4 font-semibold whitespace-nowrap">Revenue</th>
            <th className="min-w-[120px] px-4 py-4 font-semibold whitespace-nowrap">Client Paid</th>
            <th className="min-w-[120px] px-4 py-4 font-semibold whitespace-nowrap">Waived</th>
            <th className="min-w-[120px] px-4 py-4 font-semibold whitespace-nowrap">Balance Due</th>
            <th className="min-w-[120px] px-4 py-4 font-semibold whitespace-nowrap">Vendor Expenses</th>
            <th className="min-w-[120px] px-4 py-4 font-semibold text-right whitespace-nowrap">Net Profit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reports.map((r) => {
            const profitColor = r.netProfit >= 0 ? "text-success" : "text-error";
            return (
              <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="font-semibold text-foreground whitespace-nowrap">
                    {r.customerName || "Unknown Customer"}
                  </div>
                  <div className="text-xs text-muted mt-0.5 whitespace-nowrap">
                    {r.customerPhone ? `${r.customerPhone} • ` : ""}
                    {r.orderId}
                  </div>
                  <div className="text-xs text-muted mt-0.5 whitespace-nowrap">
                    {r.venue} • {r.date}
                  </div>
                </td>
                <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                  {formatCurrency(r.revenue)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                    {formatCurrency(r.clientPaid)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {r.clientWaived > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-info-soft px-2 py-1 text-xs font-medium text-info ring-1 ring-inset ring-info/20">
                      {formatCurrency(r.clientWaived)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {r.clientBalance > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-error-soft px-2 py-1 text-xs font-medium text-error ring-1 ring-inset ring-error/20">
                      {formatCurrency(r.clientBalance)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                  {r.vendorExpenses > 0 ? (
                    <span className="text-orange-600">{formatCurrency(r.vendorExpenses)}</span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className={`px-4 py-4 text-right font-bold whitespace-nowrap ${profitColor}`}>
                  {formatCurrency(r.netProfit)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
