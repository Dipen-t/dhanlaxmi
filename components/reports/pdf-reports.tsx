import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { EventProfitability, LedgerTransaction, CustomerReport, VendorOrderReport } from "@/app/reports/actions";
import { formatCurrency } from "@/lib/utils";

const pdfFormatCurrency = (amount: number | null | undefined) => {
  return formatCurrency(amount).replace(/₹/g, 'Rs. ');
};

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  table: { display: 'flex', flexDirection: 'column', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '14.28%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f3f4f6', padding: 5 },
  tableCol: { width: '14.28%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableCellHeader: { margin: 2, fontSize: 10, fontWeight: 'bold' },
  tableCell: { margin: 2, fontSize: 9 },
  
  // Specific widths for ledger
  ledgerColDate: { width: '15%' },
  ledgerColType: { width: '10%' },
  ledgerColRef: { width: '25%' },
  ledgerColNotes: { width: '35%' },
  ledgerColAmount: { width: '15%', textAlign: 'right' },
});

export const ProfitabilityPDF = ({ reports }: { reports: EventProfitability[] }) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <Text style={styles.title}>Event Profitability Report</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Customer</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Revenue</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Client Paid</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Waived</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Balance Due</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Vendor Expenses</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Net Profit</Text></View>
        </View>
        {reports.map((r, i) => (
          <View style={styles.tableRow} key={i}>
            <View style={styles.tableCol}>
              <Text style={{...styles.tableCell, fontWeight: 'bold'}}>{r.customerName || 'Unknown Customer'}</Text>
              <Text style={{...styles.tableCell, fontSize: 8, color: '#666'}}>
                {r.customerPhone ? `${r.customerPhone} • ` : ''}{r.orderId}
              </Text>
              <Text style={{...styles.tableCell, fontSize: 8, color: '#666'}}>{r.venue} • {r.date}</Text>
            </View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{pdfFormatCurrency(r.revenue)}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{pdfFormatCurrency(r.clientPaid)}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{r.clientWaived > 0 ? pdfFormatCurrency(r.clientWaived) : '-'}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{r.clientBalance > 0 ? pdfFormatCurrency(r.clientBalance) : '-'}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{r.vendorExpenses > 0 ? pdfFormatCurrency(r.vendorExpenses) : '-'}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{pdfFormatCurrency(r.netProfit)}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export const LedgerPDF = ({ ledger }: { ledger: LedgerTransaction[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Transactions Report</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{...styles.tableColHeader, ...styles.ledgerColDate}}><Text style={styles.tableCellHeader}>Date</Text></View>
          <View style={{...styles.tableColHeader, ...styles.ledgerColType}}><Text style={styles.tableCellHeader}>Type</Text></View>
          <View style={{...styles.tableColHeader, ...styles.ledgerColRef}}><Text style={styles.tableCellHeader}>Reference</Text></View>
          <View style={{...styles.tableColHeader, ...styles.ledgerColNotes}}><Text style={styles.tableCellHeader}>Notes</Text></View>
          <View style={{...styles.tableColHeader, ...styles.ledgerColAmount}}><Text style={styles.tableCellHeader}>Amount</Text></View>
        </View>
        {ledger.map((t, i) => (
          <View style={styles.tableRow} key={i}>
            <View style={{...styles.tableCol, ...styles.ledgerColDate}}><Text style={styles.tableCell}>{t.date}</Text></View>
            <View style={{...styles.tableCol, ...styles.ledgerColType}}><Text style={styles.tableCell}>{t.type}</Text></View>
            <View style={{...styles.tableCol, ...styles.ledgerColRef}}><Text style={styles.tableCell}>{t.reference}</Text></View>
            <View style={{...styles.tableCol, ...styles.ledgerColNotes}}><Text style={styles.tableCell}>{t.notes || '-'}</Text></View>
            <View style={{...styles.tableCol, ...styles.ledgerColAmount}}><Text style={styles.tableCell}>{t.type === 'OUT' ? '-' : '+'}{pdfFormatCurrency(t.amount)}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export const CustomerReportPDF = ({ reports }: { reports: CustomerReport[] }) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <Text style={styles.title}>Customer Report</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Customer Name</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Phone</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Orders</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Total Revenue</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Total Paid</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Waived</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Balance Due</Text></View>
        </View>
        {reports.map((r, i) => (
          <View style={styles.tableRow} key={i}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{r.customerName}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{r.customerPhone || '-'}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{r.totalOrders}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{pdfFormatCurrency(r.totalRevenue)}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{pdfFormatCurrency(r.totalPaid)}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{r.totalWaived > 0 ? pdfFormatCurrency(r.totalWaived) : '-'}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{r.balanceDue > 0 ? pdfFormatCurrency(r.balanceDue) : '-'}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export const VendorReportPDF = ({ reports }: { reports: VendorOrderReport[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Vendor Report</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{...styles.tableColHeader, width: '20%'}}><Text style={styles.tableCellHeader}>Order / Date</Text></View>
          <View style={{...styles.tableColHeader, width: '30%'}}><Text style={styles.tableCellHeader}>Vendor</Text></View>
          <View style={{...styles.tableColHeader, width: '30%'}}><Text style={styles.tableCellHeader}>Deliveries</Text></View>
          <View style={{...styles.tableColHeader, width: '20%', textAlign: 'right'}}><Text style={styles.tableCellHeader}>Total Paid</Text></View>
        </View>
        {reports.map((report) => (
          report.vendors.length === 0 ? (
            <View style={styles.tableRow} key={report.orderDbId}>
              <View style={{...styles.tableCol, width: '20%'}}>
                <Text style={styles.tableCell}>{report.orderId}</Text>
                <Text style={{...styles.tableCell, fontSize: 8, color: '#666'}}>{report.date}</Text>
              </View>
              <View style={{...styles.tableCol, width: '30%'}}><Text style={styles.tableCell}>-</Text></View>
              <View style={{...styles.tableCol, width: '30%'}}><Text style={styles.tableCell}>-</Text></View>
              <View style={{...styles.tableCol, width: '20%', textAlign: 'right'}}><Text style={styles.tableCell}>-</Text></View>
            </View>
          ) : (
            report.vendors.map((v, i) => (
              <View style={styles.tableRow} key={`${report.orderDbId}-${v.vendorId}`}>
                <View style={{...styles.tableCol, width: '20%'}}>
                  {i === 0 ? (
                    <>
                      <Text style={styles.tableCell}>{report.orderId}</Text>
                      <Text style={{...styles.tableCell, fontSize: 8, color: '#666'}}>{report.date}</Text>
                    </>
                  ) : <Text style={styles.tableCell}></Text>}
                </View>
                <View style={{...styles.tableCol, width: '30%'}}>
                  <Text style={styles.tableCell}>{v.vendorName}</Text>
                  <Text style={{...styles.tableCell, fontSize: 8, color: '#666'}}>{v.vendorPhone || '-'}</Text>
                </View>
                <View style={{...styles.tableCol, width: '30%'}}>
                  {v.deliveries.length > 0 ? v.deliveries.map((d, di) => (
                    <Text key={di} style={styles.tableCell}>{d.rawMaterialName} ({d.unitQty} {d.unitName})</Text>
                  )) : <Text style={styles.tableCell}>-</Text>}
                </View>
                <View style={{...styles.tableCol, width: '20%', textAlign: 'right'}}>
                  <Text style={styles.tableCell}>{pdfFormatCurrency(v.totalPaid)}</Text>
                </View>
              </View>
            ))
          )
        ))}
      </View>
    </Page>
  </Document>
);
