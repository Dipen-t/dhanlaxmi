"use client";

import type { EventProfitability } from "@/app/reports/actions";
import { formatCurrency } from "@/lib/utils";

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
      <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
        <thead className="bg-surface/50 text-muted uppercase text-xs sticky top-0 border-b border-border">
          <tr>
            <th className="w-[23%] px-3 py-3 font-semibold whitespace-nowrap">Customer</th>
            <th className="w-[11%] px-3 py-3 font-semibold whitespace-nowrap">Revenue</th>
            <th className="w-[11%] px-3 py-3 font-semibold whitespace-nowrap">Client Paid</th>
            <th className="w-[11%] px-3 py-3 font-semibold whitespace-nowrap">Waived</th>
            <th className="w-[11%] px-3 py-3 font-semibold whitespace-nowrap">Balance Due</th>
            <th className="w-[11%] px-3 py-3 font-semibold whitespace-nowrap">Vendor Paid</th>
            <th className="w-[11%] px-3 py-3 font-semibold whitespace-nowrap">Other Expenses</th>
            <th className="w-[11%] px-3 py-3 font-semibold text-right whitespace-nowrap">Net Profit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reports.map((r) => {
            const profitColor = r.netProfit >= 0 ? "text-success" : "text-error";
            return (
              <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                <td className="px-3 py-3 truncate">
                  <div className="font-semibold text-foreground truncate">
                    {r.customerName || "Unknown Customer"}
                  </div>
                  <div className="text-xs text-muted mt-0.5 truncate">
                    {r.customerPhone ? `${r.customerPhone} • ` : ""}
                    {r.orderId}
                  </div>
                  <div className="text-xs text-muted mt-0.5 truncate">
                    {r.venue} • {r.date}
                  </div>
                </td>
                <td className="px-3 py-3 font-medium text-foreground truncate">
                  {formatCurrency(r.revenue)}
                </td>
                <td className="px-3 py-3 truncate">
                  <span className="inline-flex items-center rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                    {formatCurrency(r.clientPaid)}
                  </span>
                </td>
                <td className="px-3 py-3 truncate">
                  {r.clientWaived > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-info-soft px-2 py-1 text-xs font-medium text-info ring-1 ring-inset ring-info/20">
                      {formatCurrency(r.clientWaived)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-3 py-3 truncate">
                  {r.clientBalance > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-error-soft px-2 py-1 text-xs font-medium text-error ring-1 ring-inset ring-error/20">
                      {formatCurrency(r.clientBalance)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-3 py-3 font-medium text-foreground truncate">
                  {r.vendorExpenses > 0 ? (
                    <span className="text-orange-600">{formatCurrency(r.vendorExpenses)}</span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-3 py-3 font-medium text-foreground truncate">
                  {formatCurrency(r.otherExpenses)}
                </td>
                <td className={`px-3 py-3 text-right font-bold truncate ${profitColor}`}>
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
