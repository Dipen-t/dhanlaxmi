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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"default" | "date-desc" | "date-asc">("default");

  const isDateInRange = (dateStr: string) => {
    if (!fromDate && !toDate) return true;
    if (!dateStr) return true;
    const [d, m, y] = dateStr.split("/");
    if (!d || !m || !y) return true;
    const recordDate = `${y}-${m}-${d}`;
    if (fromDate && recordDate < fromDate) return false;
    if (toDate && recordDate > toDate) return false;
    return true;
  };

  const filteredProfitability = useMemo(() => {
    let result = profitabilityReports.filter(r => isDateInRange(r.date));
    const normalized = query.trim().toLowerCase();
    if (normalized) {
      result = result.filter(r => 
        [r.orderId, r.customerName, r.venue, r.date].join(" ").toLowerCase().includes(normalized)
      );
    }
    
    if (sortOrder === "date-desc" || sortOrder === "date-asc") {
      result.sort((a, b) => {
        const [dA, mA, yA] = a.date.split("/");
        const [dB, mB, yB] = b.date.split("/");
        const dateA = new Date(`${yA}-${mA}-${dA}`).getTime();
        const dateB = new Date(`${yB}-${mB}-${dB}`).getTime();
        return sortOrder === "date-desc" ? dateB - dateA : dateA - dateB;
      });
    }
    
    return result;
  }, [profitabilityReports, query, fromDate, toDate, sortOrder]);

  const filteredLedger = useMemo(() => {
    let result = ledger.filter(t => isDateInRange(t.date));
    const normalized = query.trim().toLowerCase();
    if (normalized) {
      result = result.filter(t => 
        [t.reference, t.notes, t.date, t.type].join(" ").toLowerCase().includes(normalized)
      );
    }
    
    if (sortOrder === "date-desc" || sortOrder === "date-asc") {
      result.sort((a, b) => {
        const [dA, mA, yA] = a.date.split("/");
        const [dB, mB, yB] = b.date.split("/");
        const dateA = new Date(`${yA}-${mA}-${dA}`).getTime();
        const dateB = new Date(`${yB}-${mB}-${dB}`).getTime();
        return sortOrder === "date-desc" ? dateB - dateA : dateA - dateB;
      });
    }
    
    return result;
  }, [ledger, query, fromDate, toDate, sortOrder]);

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customerReports;
    return customerReports.filter(c => 
      [c.customerName, c.customerPhone].join(" ").toLowerCase().includes(normalized)
    );
  }, [customerReports, query]);

  const filteredVendors = useMemo(() => {
    let result = [...vendorReports];
    const normalized = query.trim().toLowerCase();
    if (normalized) {
      result = result.filter(v => {
        const vendorNames = v.vendors.map(vendor => vendor.vendorName).join(" ");
        return [v.orderId, v.venue, v.date, vendorNames].join(" ").toLowerCase().includes(normalized);
      });
    }
    
    if (sortOrder === "date-desc" || sortOrder === "date-asc") {
      result.sort((a, b) => {
        const [dA, mA, yA] = a.date.split("/");
        const [dB, mB, yB] = b.date.split("/");
        const dateA = new Date(`${yA}-${mA}-${dA}`).getTime();
        const dateB = new Date(`${yB}-${mB}-${dB}`).getTime();
        return sortOrder === "date-desc" ? dateB - dateA : dateA - dateB;
      });
    }
    
    return result;
  }, [vendorReports, query, sortOrder]);

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
          Transactions
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

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <label className="relative block flex-1 max-w-md">
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
        
        {(activeTab === "profitability" || activeTab === "ledger" || activeTab === "vendors") && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
            >
              <option value="default">Sort: Default</option>
              <option value="date-desc">Date: Newest</option>
              <option value="date-asc">Date: Oldest</option>
            </select>
          </div>
        )}
        
        {(activeTab === "profitability" || activeTab === "ledger") && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
              title="From Date"
            />
            <span className="text-muted">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
              title="To Date"
            />
          </div>
        )}
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
