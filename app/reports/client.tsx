"use client";

import { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import type { EventProfitability, LedgerTransaction, CustomerReport, VendorOrderReport } from "./actions";
import { EventProfitabilityTable } from "@/components/reports/event-profitability-table";
import { MasterLedgerTable } from "@/components/reports/master-ledger-table";
import { CustomerReportTable } from "@/components/reports/customer-report-table";
import { VendorReportTable } from "@/components/reports/vendor-report-table";
import { BarChart3, ReceiptText, FileSpreadsheet, FileText, Users, Store, Search, X } from "lucide-react";


function isDateInRange(dateStr: string, fromDate: string, toDate: string) {
    if (!fromDate && !toDate) return true;
    if (!dateStr) return true;
    const [d, m, y] = dateStr.split("/");
    if (!d || !m || !y) return true;
    const recordDate = `${y}-${m}-${d}`;
    if (fromDate && recordDate < fromDate) return false;
    if (toDate && recordDate > toDate) return false;
    return true;
}

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

  const [exporting, setExporting] = useState<"PDF" | "Excel" | null>(null);
  const exportingRef = useRef(false);
  const datedTab = activeTab === "profitability" || activeTab === "ledger";
  const invalidDateRange = datedTab && Boolean(fromDate && toDate && fromDate > toDate);
  const hasFilters = Boolean(query.trim() || (datedTab && (fromDate || toDate)));
  function clearFilters() { setQuery(""); setFromDate(""); setToDate(""); setSortOrder("default"); }



  const filteredProfitability = useMemo(() => {
    let result = profitabilityReports.filter(r => isDateInRange(r.date, fromDate, toDate));
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
    let result = ledger.filter(t => isDateInRange(t.date, fromDate, toDate));
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

  const resultCount = activeTab === "profitability" ? filteredProfitability.length : activeTab === "ledger" ? filteredLedger.length : activeTab === "customers" ? filteredCustomers.length : filteredVendors.length;
  async function exportReport(format: "PDF" | "Excel") {
    if (exportingRef.current || invalidDateRange || resultCount === 0) return;
    exportingRef.current = true;
    setExporting(format);
    try {
      const exports = await import("@/lib/export-utils");
      if (format === "Excel") {
        if (activeTab === "profitability") await exports.exportProfitabilityToExcel(filteredProfitability);
        else if (activeTab === "ledger") await exports.exportLedgerToExcel(filteredLedger);
        else if (activeTab === "customers") await exports.exportCustomerReportToExcel(filteredCustomers);
        else await exports.exportVendorReportToExcel(filteredVendors);
      } else {
        if (activeTab === "profitability") await exports.exportProfitabilityToPDF(filteredProfitability);
        else if (activeTab === "ledger") await exports.exportLedgerToPDF(filteredLedger);
        else if (activeTab === "customers") await exports.exportCustomerReportToPDF(filteredCustomers);
        else await exports.exportVendorReportToPDF(filteredVendors);
      }
    } catch { toast.error("Could not export this report. Please try again."); }
    finally { exportingRef.current = false; setExporting(null); }
  }

  return (
    <div className="flex min-h-[60dvh] min-w-0 flex-col">
      <div className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-border">
        <div className="flex min-w-0 max-w-full gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profitability")}
          aria-pressed={activeTab === "profitability"}
          className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
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
          aria-pressed={activeTab === "ledger"}
          className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
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
          aria-pressed={activeTab === "customers"}
          className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
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
          aria-pressed={activeTab === "vendors"}
          className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "vendors"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Store className="size-4" />
          Vendor Report
        </button>
        </div>
        <div className="flex shrink-0 gap-2 pb-2">
          <button type="button" disabled={exporting !== null || resultCount === 0 || invalidDateRange} onClick={() => exportReport("Excel")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><FileSpreadsheet className="size-4" aria-hidden />{exporting === "Excel" ? "Exporting..." : "Excel"}</button>
          <button type="button" disabled={exporting !== null || resultCount === 0 || invalidDateRange} onClick={() => exportReport("PDF")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><FileText className="size-4" aria-hidden />{exporting === "PDF" ? "Exporting..." : "PDF"}</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="relative block min-w-0 flex-1 basis-60 max-w-md">
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
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              aria-label="Sort reports"
              className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
            >
              <option value="default">Sort: Default</option>
              <option value="date-desc">Date: Newest</option>
              <option value="date-asc">Date: Oldest</option>
            </select>
          </div>
        )}
        
        {(activeTab === "profitability" || activeTab === "ledger") && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
              aria-label="From date"
              max={toDate || undefined}
              title="From Date"
            />
            <span className="text-muted">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="min-h-11 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
              aria-label="To date"
              min={fromDate || undefined}
              title="To Date"
            />
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted">
        <p role="status">{resultCount} record{resultCount === 1 ? "" : "s"} shown. Exports include these records.</p>
        {hasFilters ? <button type="button" onClick={clearFilters} className="min-h-11 rounded-lg px-3 font-medium text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear filters</button> : null}
      </div>
      {invalidDateRange ? <p role="alert" className="mb-4 text-sm text-error">From date must be on or before To date.</p> : null}
      <div className="flex-1 bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {hasFilters && resultCount === 0 ? <div className="p-8 text-center"><p className="font-medium">No matching records</p><p className="mt-1 text-sm text-muted">Change your search or dates, or clear the filters.</p><button type="button" onClick={clearFilters} className="mt-3 min-h-11 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Clear filters</button></div> : activeTab === "profitability" ? (
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
