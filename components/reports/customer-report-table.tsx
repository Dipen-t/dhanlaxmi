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
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-surface/50 text-muted uppercase text-xs sticky top-0 border-b border-border">
          <tr>
            <th className="w-[20%] px-6 py-4 font-semibold whitespace-nowrap">Customer Name</th>
            <th className="w-[15%] px-6 py-4 font-semibold whitespace-nowrap">Phone</th>
            <th className="w-[10%] px-6 py-4 font-semibold text-center whitespace-nowrap">Orders</th>
            <th className="w-[15%] px-6 py-4 font-semibold whitespace-nowrap">Total Revenue</th>
            <th className="w-[15%] px-6 py-4 font-semibold whitespace-nowrap">Total Paid</th>
            <th className="w-[10%] px-6 py-4 font-semibold whitespace-nowrap">Waived</th>
            <th className="w-[15%] px-6 py-4 font-semibold text-right whitespace-nowrap">Balance Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reports.map((r) => {
            const balanceColor = r.balanceDue > 0 ? "text-error" : "text-success";
            return (
              <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground truncate">
                  {r.customerName}
                </td>
                <td className="px-6 py-4 text-muted truncate">
                  {r.customerPhone || "—"}
                </td>
                <td className="px-6 py-4 text-center font-medium text-foreground truncate">
                  {r.totalOrders}
                </td>
                <td className="px-6 py-4 font-medium text-foreground truncate">
                  {formatCurrency(r.totalRevenue)}
                </td>
                <td className="px-6 py-4 truncate">
                  <span className="inline-flex items-center rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                    {formatCurrency(r.totalPaid)}
                  </span>
                </td>
                <td className="px-6 py-4 truncate">
                  {r.totalWaived > 0 ? (
                    <span className="inline-flex items-center rounded-md bg-info-soft px-2 py-1 text-xs font-medium text-info ring-1 ring-inset ring-info/20">
                      {formatCurrency(r.totalWaived)}
                    </span>
                  ) : (
                    <span className="text-muted text-xs font-medium">—</span>
                  )}
                </td>
                <td className={`px-6 py-4 text-right font-bold truncate ${balanceColor}`}>
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
