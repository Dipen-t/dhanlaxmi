import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { EventProfitability, LedgerTransaction, CustomerReport, VendorOrderReport } from "@/app/reports/actions";
import { formatCurrency } from "@/components/payments/payment-badges";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";

const pdfFormatCurrency = (amount: number | null | undefined) => {
  return formatCurrency(amount).replace(/₹/g, 'Rs. ');
};

const colors = {
  white: "#FFFFFF",
  cream: "#F7FAFA",
  ink: "#1A2423",
  muted: "#5A6967",
  teal: "#0F766E",
  tealDeep: "#0D5C56",
  tealLine: "#A5D4CE",
  rule: "#D5E0DE",
};

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    fontSize: 10, 
    fontFamily: 'Helvetica',
    color: colors.ink,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.teal,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.tealDeep,
    marginBottom: 4,
  },
  brandMeta: {
    fontSize: 9,
    color: colors.muted,
  },
  titleContainer: {
    alignItems: 'flex-end',
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: colors.ink,
  },
  date: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
  },
  table: { 
    display: 'flex', 
    flexDirection: 'column', 
    width: 'auto', 
  },
  tableRow: { 
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  tableRowAlternate: {
    backgroundColor: colors.cream,
  },
  tableColHeader: { 
    borderBottomWidth: 2, 
    borderBottomColor: colors.tealLine, 
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableCol: { 
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableCellHeader: { 
    fontSize: 9, 
    fontWeight: 'bold',
    color: colors.tealDeep,
    textTransform: 'uppercase',
  },
  tableCell: { 
    fontSize: 9,
    lineHeight: 1.4,
  },
  
  // Specific widths for ledger
  ledgerColDate: { width: '15%' },
  ledgerColType: { width: '15%' },
  ledgerColRef: { width: '20%' },
  ledgerColNotes: { width: '35%' },
  ledgerColAmount: { width: '15%', textAlign: 'right' },
});

const PdfHeader = ({ title, logoAssets }: { title: string, logoAssets?: PdfLogoAssets }) => (
  <View style={styles.header}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {logoAssets && (
        <Image 
          src={logoAssets.src} 
          style={{ width: 60, height: 60 / (logoAssets.headerWidth / logoAssets.headerHeight), marginRight: 15 }} 
        />
      )}
      <View>
        <Text style={styles.brandName}>Dhan Laxmi Catering</Text>
        <Text style={styles.brandMeta}>Premium Catering Services</Text>
      </View>
    </View>
    <View style={styles.titleContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>Generated on {new Date().toLocaleDateString()}</Text>
    </View>
  </View>
);

export const ProfitabilityPDF = ({ reports, logoAssets }: { reports: EventProfitability[], logoAssets?: PdfLogoAssets }) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <PdfHeader title="Event Profitability" logoAssets={logoAssets} />
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{...styles.tableColHeader, width: '25%'}}><Text style={styles.tableCellHeader}>Customer</Text></View>
          <View style={{...styles.tableColHeader, width: '12.5%'}}><Text style={styles.tableCellHeader}>Revenue</Text></View>
          <View style={{...styles.tableColHeader, width: '12.5%'}}><Text style={styles.tableCellHeader}>Client Paid</Text></View>
          <View style={{...styles.tableColHeader, width: '12.5%'}}><Text style={styles.tableCellHeader}>Waived</Text></View>
          <View style={{...styles.tableColHeader, width: '12.5%'}}><Text style={styles.tableCellHeader}>Balance Due</Text></View>
          <View style={{...styles.tableColHeader, width: '12.5%'}}><Text style={styles.tableCellHeader}>Vendor Expenses</Text></View>
          <View style={{...styles.tableColHeader, width: '12.5%', textAlign: 'right'}}><Text style={styles.tableCellHeader}>Net Profit</Text></View>
        </View>
        {reports.map((r, i) => (
          <View style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlternate : {}]} key={i}>
            <View style={{...styles.tableCol, width: '25%'}}>
              <Text style={{...styles.tableCell, fontWeight: 'bold'}}>{r.customerName || 'Unknown Customer'}</Text>
              <Text style={{...styles.tableCell, fontSize: 8, color: colors.muted}}>
                {r.customerPhone ? `${r.customerPhone} • ` : ''}{r.orderId}
              </Text>
              <Text style={{...styles.tableCell, fontSize: 8, color: colors.muted}}>{r.venue} • {r.date}</Text>
            </View>
            <View style={{...styles.tableCol, width: '12.5%'}}><Text style={styles.tableCell}>{pdfFormatCurrency(r.revenue)}</Text></View>
            <View style={{...styles.tableCol, width: '12.5%'}}><Text style={styles.tableCell}>{pdfFormatCurrency(r.clientPaid)}</Text></View>
            <View style={{...styles.tableCol, width: '12.5%'}}><Text style={styles.tableCell}>{r.clientWaived > 0 ? pdfFormatCurrency(r.clientWaived) : '-'}</Text></View>
            <View style={{...styles.tableCol, width: '12.5%'}}><Text style={{...styles.tableCell, color: r.clientBalance > 0 ? '#b91c1c' : colors.ink}}>{r.clientBalance > 0 ? pdfFormatCurrency(r.clientBalance) : '-'}</Text></View>
            <View style={{...styles.tableCol, width: '12.5%'}}><Text style={styles.tableCell}>{r.vendorExpenses > 0 ? pdfFormatCurrency(r.vendorExpenses) : '-'}</Text></View>
            <View style={{...styles.tableCol, width: '12.5%', textAlign: 'right'}}><Text style={{...styles.tableCell, fontWeight: 'bold', color: r.netProfit >= 0 ? colors.tealDeep : '#b91c1c'}}>{pdfFormatCurrency(r.netProfit)}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export const LedgerPDF = ({ ledger, logoAssets }: { ledger: LedgerTransaction[], logoAssets?: PdfLogoAssets }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <PdfHeader title="Master Ledger" logoAssets={logoAssets} />
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{...styles.tableColHeader, ...styles.ledgerColDate}}><Text style={styles.tableCellHeader}>Date</Text></View>
          <View style={{...styles.tableColHeader, ...styles.ledgerColType}}><Text style={styles.tableCellHeader}>Type</Text></View>
          <View style={{...styles.tableColHeader, ...styles.ledgerColRef}}><Text style={styles.tableCellHeader}>Reference</Text></View>
          <View style={{...styles.tableColHeader, ...styles.ledgerColNotes}}><Text style={styles.tableCellHeader}>Notes</Text></View>
          <View style={{...styles.tableColHeader, ...styles.ledgerColAmount}}><Text style={styles.tableCellHeader}>Amount</Text></View>
        </View>
        {ledger.map((t, i) => (
          <View style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlternate : {}]} key={i}>
            <View style={{...styles.tableCol, ...styles.ledgerColDate}}><Text style={styles.tableCell}>{t.date}</Text></View>
            <View style={{...styles.tableCol, ...styles.ledgerColType}}>
              <Text style={{...styles.tableCell, color: t.type === 'OUT' ? '#b91c1c' : colors.tealDeep}}>{t.type}</Text>
            </View>
            <View style={{...styles.tableCol, ...styles.ledgerColRef}}><Text style={styles.tableCell}>{t.reference}</Text></View>
            <View style={{...styles.tableCol, ...styles.ledgerColNotes}}><Text style={styles.tableCell}>{t.notes || '-'}</Text></View>
            <View style={{...styles.tableCol, ...styles.ledgerColAmount}}>
              <Text style={{...styles.tableCell, fontWeight: 'bold', color: t.type === 'OUT' ? '#b91c1c' : colors.tealDeep}}>
                {t.type === 'OUT' ? '-' : '+'}{pdfFormatCurrency(t.amount)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export const CustomerReportPDF = ({ reports, logoAssets }: { reports: CustomerReport[], logoAssets?: PdfLogoAssets }) => (
  <Document>
    <Page size="A4" style={styles.page} orientation="landscape">
      <PdfHeader title="Customer Report" logoAssets={logoAssets} />
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{...styles.tableColHeader, width: '20%'}}><Text style={styles.tableCellHeader}>Customer Name</Text></View>
          <View style={{...styles.tableColHeader, width: '15%'}}><Text style={styles.tableCellHeader}>Phone</Text></View>
          <View style={{...styles.tableColHeader, width: '10%', textAlign: 'center'}}><Text style={styles.tableCellHeader}>Orders</Text></View>
          <View style={{...styles.tableColHeader, width: '15%'}}><Text style={styles.tableCellHeader}>Total Revenue</Text></View>
          <View style={{...styles.tableColHeader, width: '15%'}}><Text style={styles.tableCellHeader}>Total Paid</Text></View>
          <View style={{...styles.tableColHeader, width: '10%'}}><Text style={styles.tableCellHeader}>Waived</Text></View>
          <View style={{...styles.tableColHeader, width: '15%', textAlign: 'right'}}><Text style={styles.tableCellHeader}>Balance Due</Text></View>
        </View>
        {reports.map((r, i) => (
          <View style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlternate : {}]} key={i}>
            <View style={{...styles.tableCol, width: '20%'}}><Text style={{...styles.tableCell, fontWeight: 'bold'}}>{r.customerName}</Text></View>
            <View style={{...styles.tableCol, width: '15%'}}><Text style={styles.tableCell}>{r.customerPhone || '-'}</Text></View>
            <View style={{...styles.tableCol, width: '10%', textAlign: 'center'}}><Text style={styles.tableCell}>{r.totalOrders}</Text></View>
            <View style={{...styles.tableCol, width: '15%'}}><Text style={styles.tableCell}>{pdfFormatCurrency(r.totalRevenue)}</Text></View>
            <View style={{...styles.tableCol, width: '15%'}}><Text style={{...styles.tableCell, color: colors.tealDeep}}>{pdfFormatCurrency(r.totalPaid)}</Text></View>
            <View style={{...styles.tableCol, width: '10%'}}><Text style={styles.tableCell}>{r.totalWaived > 0 ? pdfFormatCurrency(r.totalWaived) : '-'}</Text></View>
            <View style={{...styles.tableCol, width: '15%', textAlign: 'right'}}><Text style={{...styles.tableCell, fontWeight: 'bold', color: r.balanceDue > 0 ? '#b91c1c' : colors.tealDeep}}>{r.balanceDue > 0 ? pdfFormatCurrency(r.balanceDue) : 'Settled'}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export const VendorReportPDF = ({ reports, logoAssets }: { reports: VendorOrderReport[], logoAssets?: PdfLogoAssets }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <PdfHeader title="Vendor Report" logoAssets={logoAssets} />
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={{...styles.tableColHeader, width: '25%'}}><Text style={styles.tableCellHeader}>Order / Date</Text></View>
          <View style={{...styles.tableColHeader, width: '25%'}}><Text style={styles.tableCellHeader}>Vendor</Text></View>
          <View style={{...styles.tableColHeader, width: '35%'}}><Text style={styles.tableCellHeader}>Deliveries</Text></View>
          <View style={{...styles.tableColHeader, width: '15%', textAlign: 'right'}}><Text style={styles.tableCellHeader}>Total Paid</Text></View>
        </View>
        {reports.map((report) => (
          report.vendors.length === 0 ? (
            <View style={styles.tableRow} key={report.orderDbId}>
              <View style={{...styles.tableCol, width: '25%'}}>
                <Text style={{...styles.tableCell, fontWeight: 'bold'}}>{report.orderId}</Text>
                <Text style={{...styles.tableCell, fontSize: 8, color: colors.muted}}>{report.date}</Text>
              </View>
              <View style={{...styles.tableCol, width: '25%'}}><Text style={styles.tableCell}>-</Text></View>
              <View style={{...styles.tableCol, width: '35%'}}><Text style={styles.tableCell}>-</Text></View>
              <View style={{...styles.tableCol, width: '15%', textAlign: 'right'}}><Text style={styles.tableCell}>-</Text></View>
            </View>
          ) : (
            report.vendors.map((v, i) => (
              <View style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlternate : {}]} key={`${report.orderDbId}-${v.vendorId}`}>
                <View style={{...styles.tableCol, width: '25%'}}>
                  {i === 0 ? (
                    <>
                      <Text style={{...styles.tableCell, fontWeight: 'bold'}}>{report.orderId}</Text>
                      <Text style={{...styles.tableCell, fontSize: 8, color: colors.muted}}>{report.date}</Text>
                    </>
                  ) : <Text style={styles.tableCell}></Text>}
                </View>
                <View style={{...styles.tableCol, width: '25%'}}>
                  <Text style={{...styles.tableCell, fontWeight: 'bold'}}>{v.vendorName}</Text>
                  <Text style={{...styles.tableCell, fontSize: 8, color: colors.muted}}>{v.vendorPhone || '-'}</Text>
                </View>
                <View style={{...styles.tableCol, width: '35%'}}>
                  {v.deliveries.length > 0 ? v.deliveries.map((d, di) => (
                    <Text key={di} style={styles.tableCell}>• {d.rawMaterialName} ({d.unitQty} {d.unitName})</Text>
                  )) : <Text style={styles.tableCell}>-</Text>}
                </View>
                <View style={{...styles.tableCol, width: '15%', textAlign: 'right'}}>
                  <Text style={{...styles.tableCell, fontWeight: 'bold', color: colors.tealDeep}}>{pdfFormatCurrency(v.totalPaid)}</Text>
                </View>
              </View>
            ))
          )
        ))}
      </View>
    </Page>
  </Document>
);
