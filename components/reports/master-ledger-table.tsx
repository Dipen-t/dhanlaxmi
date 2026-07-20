"use client";

import type { LedgerTransaction } from "@/app/reports/actions";
import { formatCurrency } from "@/components/payments/payment-badges";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function MasterLedgerTable({ ledger }: { ledger: LedgerTransaction[] }) {
  if (ledger.length === 0) {
    return (
      <div className="p-12 text-center text-muted">
        No transactions recorded yet.
      </div>
    );
  }

  return (
    <div className="w-full flex-1 overflow-auto">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-surface/50 text-muted uppercase text-xs sticky top-0 border-b border-border">
          <tr>
            <th className="w-[15%] px-6 py-4 font-semibold whitespace-nowrap">Date</th>
            <th className="w-[15%] px-6 py-4 font-semibold whitespace-nowrap">Type</th>
            <th className="w-[20%] px-6 py-4 font-semibold whitespace-nowrap">Reference</th>
            <th className="w-[35%] px-6 py-4 font-semibold whitespace-nowrap">Notes</th>
            <th className="w-[15%] px-6 py-4 font-semibold text-right whitespace-nowrap">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ledger.map((t) => {
            const isOut = t.type === "OUT";
            const amountColor = isOut ? "text-error" : "text-success";
            const prefix = isOut ? "-" : "+";
            
            return (
              <tr key={t.id} className="hover:bg-surface/30 transition-colors">
                <td className="px-6 py-4 text-foreground truncate">
                  {t.date}
                </td>
                <td className="px-6 py-4 truncate">
                  {isOut ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-error-soft px-2 py-1 text-xs font-medium text-error ring-1 ring-inset ring-error/20">
                      <ArrowUpRight className="size-3" />
                      Paid Out
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                      <ArrowDownRight className="size-3" />
                      Received In
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-foreground truncate">
                  {t.reference}
                </td>
                <td className="px-6 py-4 text-muted truncate">
                  {t.notes || "—"}
                </td>
                <td className={`px-6 py-4 text-right font-bold truncate ${amountColor}`}>
                  {prefix} {formatCurrency(t.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
