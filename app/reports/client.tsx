"use client";

import { useState, useMemo } from "react";
import type { EventProfitability, LedgerTransaction, CustomerReport, VendorOrderReport } from "./actions";
import { EventProfitabilityTable } from "@/components/reports/event-profitability-table";
import { MasterLedgerTable } from "@/components/reports/master-ledger-table";
import { CustomerReportTable } from "@/components/reports/customer-report-table";
import { VendorReportTable } from "@/components/reports/vendor-report-table";
import { BarChart3, ReceiptText, FileSpreadsheet, FileText, Users, Store, Search, X } from "lucide-react";
import { 
  exportProfitabilityToExcel, 
  exportLedgerToExcel, 
  exportCustomerReportToExcel,
  exportVendorReportToExcel,
  exportProfitabilityToPDF, 
  exportLedgerToPDF,
  exportCustomerReportToPDF,
  exportVendorReportToPDF
} from "@/lib/export-utils";

export function ReportsClient({
  profitabilityReports,
  ledger,
  customerReports,
  vendorReports,
}: {
  profitabilityReports: EventProfitability[];
  ledger: LedgerTransaction[];
  customerReports: CustomerReport[];
  vendorReports: VendorOrderReport[];
}) {
  const [activeTab, setActiveTab] = useState<"profitability" | "ledger" | "customers" | "vendors">("profitability");
  const [query, setQuery] = useState("");

  const filteredProfitability = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return profitabilityReports;
    return profitabilityReports.filter(r => 
      [r.orderId, r.customerName, r.venue, r.date].join(" ").toLowerCase().includes(normalized)
    );
  }, [profitabilityReports, query]);

  const filteredLedger = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ledger;
    return ledger.filter(t => 
      [t.orderId, t.customerName, t.date, t.type].join(" ").toLowerCase().includes(normalized)
    );
  }, [ledger, query]);

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customerReports;
    return customerReports.filter(c => 
      [c.customerName, c.customerPhone].join(" ").toLowerCase().includes(normalized)
    );
  }, [customerReports, query]);

  const filteredVendors = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return vendorReports;
    return vendorReports.filter(v => 
      [v.vendorName].join(" ").toLowerCase().includes(normalized)
    );
  }, [vendorReports, query]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex justify-between items-end mb-6 border-b border-border">
        <div className="flex gap-4">
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
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "customers"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Users className="size-4" />
          Customer Report
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "vendors"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Store className="size-4" />
          Vendor Report
        </button>
        </div>
        <div className="flex gap-2 pb-2">
          <button
            onClick={() => {
              if (activeTab === "profitability") {
                exportProfitabilityToExcel(profitabilityReports);
              } else if (activeTab === "ledger") {
                exportLedgerToExcel(ledger);
              } else if (activeTab === "customers") {
                exportCustomerReportToExcel(customerReports);
              } else if (activeTab === "vendors") {
                exportVendorReportToExcel(vendorReports);
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm font-medium border border-border hover:border-primary/50 transition-colors"
          >
            <FileSpreadsheet className="size-4" />
            Excel
          </button>
          <button
            onClick={async () => {
              if (activeTab === "profitability") {
                await exportProfitabilityToPDF(profitabilityReports);
              } else if (activeTab === "ledger") {
                await exportLedgerToPDF(ledger);
              } else if (activeTab === "customers") {
                await exportCustomerReportToPDF(customerReports);
              } else if (activeTab === "vendors") {
                await exportVendorReportToPDF(vendorReports);
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm font-medium border border-border hover:border-primary/50 transition-colors"
          >
            <FileText className="size-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="relative block w-full max-w-md">
          <span className="sr-only">Search reports</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, name, date..."
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
      </div>

      <div className="flex-1 bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {activeTab === "profitability" ? (
          <EventProfitabilityTable reports={filteredProfitability} />
        ) : activeTab === "ledger" ? (
          <MasterLedgerTable ledger={filteredLedger} />
        ) : activeTab === "customers" ? (
          <CustomerReportTable reports={filteredCustomers} />
        ) : (
          <VendorReportTable reports={filteredVendors} />
        )}
      </div>
    </div>
  );
}
