import * as XLSX from 'xlsx';
import { pdf } from '@react-pdf/renderer';
import { ProfitabilityPDF, LedgerPDF, CustomerReportPDF, VendorReportPDF } from '@/components/reports/pdf-reports';
import type { EventProfitability, LedgerTransaction, CustomerReport, VendorOrderReport } from "@/app/reports/actions";
import { createElement, ReactElement } from 'react';

export const exportToExcel = (data: Record<string, unknown>[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportProfitabilityToExcel = (reports: EventProfitability[]) => {
  const data = reports.map(r => ({
    "Customer Name": r.customerName || "Unknown Customer",
    "Customer Phone": r.customerPhone || "-",
    "Order ID": r.orderId,
    "Date": r.date,
    "Venue": r.venue,
    "Meal Type": r.mealType,
    "Revenue": r.revenue,
    "Client Paid": r.clientPaid,
    "Client Waived": r.clientWaived,
    "Client Balance": r.clientBalance,
    "Vendor Expenses": r.vendorExpenses,
    "Net Profit": r.netProfit,
  }));
  exportToExcel(data, "Event_Profitability_Report");
};

export const exportLedgerToExcel = (ledger: LedgerTransaction[]) => {
  const data = ledger.map(l => ({
    "Date": l.date,
    "Type": l.type,
    "Reference": l.reference,
    "Notes": l.notes || "",
    "Amount": l.type === 'OUT' ? -l.amount : l.amount,
  }));
  exportToExcel(data, "Transactions_Report");
};

export const exportCustomerReportToExcel = (reports: CustomerReport[]) => {
  const data = reports.map(r => ({
    "Customer Name": r.customerName,
    "Phone": r.customerPhone || "",
    "Orders": r.totalOrders,
    "Total Revenue": r.totalRevenue,
    "Total Paid": r.totalPaid,
    "Waived": r.totalWaived,
    "Balance Due": r.balanceDue,
  }));
  exportToExcel(data, "Customer_Report");
};

export const exportVendorReportToExcel = (reports: VendorOrderReport[]) => {
  const data: Record<string, unknown>[] = [];
  for (const report of reports) {
    if (report.vendors.length === 0) {
      data.push({
        "Order ID": report.orderId,
        "Date": report.date,
        "Venue": report.venue,
        "Vendor Name": "-",
        "Vendor Phone": "-",
        "Deliveries": "-",
        "Payments": "-",
        "Total Vendor Paid": 0,
      });
      continue;
    }

    for (const v of report.vendors) {
      const deliveries = v.deliveries.map(d => `${d.rawMaterialName} (${d.unitQty} ${d.unitName})`).join(", ");
      const payments = v.payments.map(p => `${p.date}: ${p.amount}`).join(", ");
      data.push({
        "Order ID": report.orderId,
        "Date": report.date,
        "Venue": report.venue,
        "Vendor Name": v.vendorName,
        "Vendor Phone": v.vendorPhone || "-",
        "Deliveries": deliveries || "-",
        "Payments": payments || "-",
        "Total Vendor Paid": v.totalPaid,
      });
    }
  }
  exportToExcel(data, "Vendor_Report");
};

export const exportProfitabilityToPDF = async (reports: EventProfitability[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(createElement(ProfitabilityPDF, { reports }) as ReactElement<any>).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Event_Profitability_Report.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportLedgerToPDF = async (ledger: LedgerTransaction[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(createElement(LedgerPDF, { ledger }) as ReactElement<any>).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Transactions_Report.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportCustomerReportToPDF = async (reports: CustomerReport[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(createElement(CustomerReportPDF, { reports }) as ReactElement<any>).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Customer_Report.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportVendorReportToPDF = async (reports: VendorOrderReport[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(createElement(VendorReportPDF, { reports }) as ReactElement<any>).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Vendor_Report.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
