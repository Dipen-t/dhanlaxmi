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
    <div className="w-full flex-1 overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface/50 text-muted uppercase text-xs sticky top-0 border-b border-border">
          <tr>
            <th className="min-w-[200px] px-4 py-4 font-semibold whitespace-nowrap">Customer Name</th>
            <th className="min-w-[150px] px-4 py-4 font-semibold whitespace-nowrap">Phone</th>
            <th className="min-w-[100px] px-4 py-4 font-semibold text-center whitespace-nowrap">Orders</th>
            <th className="min-w-[150px] px-4 py-4 font-semibold whitespace-nowrap">Total Revenue</th>
            <th className="min-w-[150px] px-4 py-4 font-semibold whitespace-nowrap">Total Paid</th>
            <th className="min-w-[120px] px-4 py-4 font-semibold whitespace-nowrap">Waived</th>
            <th className="min-w-[150px] px-4 py-4 font-semibold text-right whitespace-nowrap">Balance Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reports.map((r) => {
            const balanceColor = r.balanceDue > 0 ? "text-error" : "text-success";
            return (
              <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                  {r.customerName}
                </td>
                <td className="px-4 py-4 text-muted whitespace-nowrap">
                  {r.customerPhone || "—"}
                </td>
                <td className="px-4 py-4 text-center font-medium text-foreground whitespace-nowrap">
                  {r.totalOrders}
                </td>
                <td className="px-4 py-4 font-medium text-foreground whitespace-nowrap">
                  {formatCurrency(r.totalRevenue)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                    {formatCurrency(r.totalPaid)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {r.totalWaived > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-info-soft px-2 py-1 text-xs font-medium text-info ring-1 ring-inset ring-info/20">
                      {formatCurrency(r.totalWaived)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className={`px-4 py-4 text-right font-bold whitespace-nowrap ${balanceColor}`}>
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
