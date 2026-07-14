"use client";

import { useState } from "react";
import type { EventProfitability, LedgerTransaction } from "./actions";
import { EventProfitabilityTable } from "@/components/reports/event-profitability-table";
import { MasterLedgerTable } from "@/components/reports/master-ledger-table";
import { BarChart3, ReceiptText } from "lucide-react";

export function ReportsClient({
  profitabilityReports,
  ledger,
}: {
  profitabilityReports: EventProfitability[];
  ledger: LedgerTransaction[];
}) {
  const [activeTab, setActiveTab] = useState<"profitability" | "ledger">("profitability");

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("profitability")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "profitability"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <BarChart3 className="size-4" />
          Event Profitability
        </button>
        <button
          onClick={() => setActiveTab("ledger")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "ledger"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <ReceiptText className="size-4" />
          Master Ledger
        </button>
      </div>

      <div className="flex-1 bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {activeTab === "profitability" ? (
          <EventProfitabilityTable reports={profitabilityReports} />
        ) : (
          <MasterLedgerTable ledger={ledger} />
        )}
      </div>
    </div>
  );
}
