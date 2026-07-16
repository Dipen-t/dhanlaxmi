"use client";

import type { CustomerReport } from "@/app/reports/actions";
import { formatCurrency } from "@/components/payments/payment-badges";

export function CustomerReportTable({ reports }: { reports: CustomerReport[] }) {
  if (reports.length === 0) {
    return (
      <div className="p-12 text-center text-muted">
        No customer data available yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-surface/50 text-muted uppercase text-xs sticky top-0 border-b border-border">
          <tr>
            <th className="px-6 py-4 font-semibold">Customer Name</th>
            <th className="px-6 py-4 font-semibold">Phone</th>
            <th className="px-6 py-4 font-semibold text-center">Orders</th>
            <th className="px-6 py-4 font-semibold">Total Revenue</th>
            <th className="px-6 py-4 font-semibold">Total Paid</th>
            <th className="px-6 py-4 font-semibold">Waived</th>
            <th className="px-6 py-4 font-semibold text-right">Balance Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reports.map((r) => {
            const balanceColor = r.balanceDue > 0 ? "text-error" : "text-success";
            return (
              <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">
                  {r.customerName}
                </td>
                <td className="px-6 py-4 text-muted">
                  {r.customerPhone || "—"}
                </td>
                <td className="px-6 py-4 text-center font-medium text-foreground">
                  {r.totalOrders}
                </td>
                <td className="px-6 py-4 font-medium text-foreground">
                  {formatCurrency(r.totalRevenue)}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                    {formatCurrency(r.totalPaid)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {r.totalWaived > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-info-soft px-2 py-1 text-xs font-medium text-info ring-1 ring-inset ring-info/20">
                      {formatCurrency(r.totalWaived)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className={`px-6 py-4 text-right font-bold ${balanceColor}`}>
                  {r.balanceDue > 0 ? formatCurrency(r.balanceDue) : "Settled"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
