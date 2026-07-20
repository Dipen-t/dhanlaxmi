"use client";

import { useState } from "react";
import type { EventProfitability, LedgerTransaction, CustomerReport, VendorOrderReport } from "./actions";
import { EventProfitabilityTable } from "@/components/reports/event-profitability-table";
import { MasterLedgerTable } from "@/components/reports/master-ledger-table";
import { CustomerReportTable } from "@/components/reports/customer-report-table";
import { VendorReportTable } from "@/components/reports/vendor-report-table";
import { BarChart3, ReceiptText, FileSpreadsheet, FileText, Users, Store } from "lucide-react";
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
  logoAssets,
}: {
  profitabilityReports: EventProfitability[];
  ledger: LedgerTransaction[];
  customerReports: CustomerReport[];
  vendorReports: VendorOrderReport[];
  logoAssets: import("@/lib/menus/prepare-pdf-logo").PdfLogoAssets;
}) {
  const [activeTab, setActiveTab] = useState<"profitability" | "ledger" | "customers" | "vendors">("profitability");

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
                await exportProfitabilityToPDF(profitabilityReports, logoAssets);
              } else if (activeTab === "ledger") {
                await exportLedgerToPDF(ledger, logoAssets);
              } else if (activeTab === "customers") {
                await exportCustomerReportToPDF(customerReports, logoAssets);
              } else if (activeTab === "vendors") {
                await exportVendorReportToPDF(vendorReports, logoAssets);
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 text-sm font-medium border border-border hover:border-primary/50 transition-colors"
          >
            <FileText className="size-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="flex-1 bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {activeTab === "profitability" ? (
          <EventProfitabilityTable reports={profitabilityReports} />
        ) : activeTab === "ledger" ? (
          <MasterLedgerTable ledger={ledger} />
        ) : activeTab === "customers" ? (
          <CustomerReportTable reports={customerReports} />
        ) : (
          <VendorReportTable reports={vendorReports} />
        )}
      </div>
    </div>
  );
}
