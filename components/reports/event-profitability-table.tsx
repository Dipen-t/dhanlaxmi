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
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-surface/50 text-muted uppercase text-xs sticky top-0 border-b border-border">
          <tr>
            <th className="px-6 py-4 font-semibold">Event</th>
            <th className="px-6 py-4 font-semibold">Revenue</th>
            <th className="px-6 py-4 font-semibold">Client Paid</th>
            <th className="px-6 py-4 font-semibold">Waived</th>
            <th className="px-6 py-4 font-semibold">Balance Due</th>
            <th className="px-6 py-4 font-semibold">Vendor Expenses</th>
            <th className="px-6 py-4 font-semibold text-right">Net Profit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reports.map((r) => {
            const profitColor = r.netProfit >= 0 ? "text-emerald-600" : "text-red-600";
            return (
              <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground">{r.orderId}</div>
                  <div className="text-xs text-muted mt-0.5">{r.venue} • {r.date}</div>
                </td>
                <td className="px-6 py-4 font-medium text-foreground">
                  {formatCurrency(r.revenue)}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    {formatCurrency(r.clientPaid)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {r.clientWaived > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
                      {formatCurrency(r.clientWaived)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {r.clientBalance > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                      {formatCurrency(r.clientBalance)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">
                  {r.vendorExpenses > 0 ? (
                    <span className="text-orange-600">{formatCurrency(r.vendorExpenses)}</span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className={`px-6 py-4 text-right font-bold ${profitColor}`}>
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
