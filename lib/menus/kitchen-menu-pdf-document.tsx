import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { KitchenMenuDetail } from "@/app/kitchen-menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { formatDeliveryTime } from "@/lib/kitchen-menus/delivery-time";

const styles = StyleSheet.create({
  page: { padding: 32, paddingBottom: 35, fontFamily: "SourceSans", fontSize: 10, color: "#000000", backgroundColor: "#FFFFFF" },
  header: { alignItems: "center", marginBottom: 12 },
  title: { fontSize: 10, marginTop: 5, textAlign: "center" },
  table: { borderTopWidth: 0.6, borderLeftWidth: 0.6, borderColor: "#555555" },
  row: { flexDirection: "row" },
  half: { width: "50%", flexDirection: "row" },
  cell: { borderRightWidth: 0.6, borderBottomWidth: 0.6, borderColor: "#555555", paddingHorizontal: 5, paddingVertical: 4, minHeight: 23, justifyContent: "center" },
  label: { width: "48%" },
  value: { width: "52%" },
  labelText: { fontSize: 10, fontWeight: 600 },
  valueText: { fontSize: 10, lineHeight: 1.2 },
  footer: { position: "absolute", bottom: 17, left: 32, right: 32, textAlign: "right", fontSize: 8, color: "#555555" },
});

type Entry = { label: string; value: string };
type MenuPdfDocumentProps = { menu: KitchenMenuDetail; logo: PdfLogoAssets };

function menuEntries(menu: KitchenMenuDetail): Entry[] {
  const date = menu.date ? new Date(menu.date) : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}` : "";
  const entries: Entry[] = [
    { label: "DATE", value: dateLabel },
    { label: "VENUE", value: menu.venue ?? "" },
    { label: "PERSONS", value: menu.numberOfPersons ? String(menu.numberOfPersons) : "" },
    { label: "LUNCH", value: menu.mealType === "Lunch" ? "Yes" : "" },
    { label: "DINNER", value: menu.mealType === "Dinner" ? "Yes" : "" },
    { label: "DELIVER BY", value: formatDeliveryTime(menu.deliveryTime) ?? "" },
  ];
  for (const category of menu.categories) {
    if (category.isQtyField) {
      for (const dish of category.dishes) entries.push({ label: dish.name, value: dish.quantity ?? "" });
    } else {
      // Each dish remains a complete row; large categories can span pages.
      category.dishes.forEach((dish, index) => {
        entries.push({ label: index === 0 ? category.name : `${category.name} (cont.)`, value: dish.quantity ? `${dish.name} - ${dish.quantity}` : dish.name });
      });
    }
  }
  return entries;
}

function Cells({ entry }: { entry?: Entry }) {
  return (
    <View style={styles.half}>
      <View style={[styles.cell, styles.label]}><Text style={styles.labelText}>{entry?.label.toUpperCase() ?? " "}</Text></View>
      <View style={[styles.cell, styles.value]}><Text style={styles.valueText}>{entry?.value || " "}</Text></View>
    </View>
  );
}

function lineCount(text: string, capacity: number) {
  let lines = 1;
  let used = 0;
  for (const word of text.split(/\s+/)) {
    const length = word.length;
    if (used && used + length + 1 > capacity) { lines++; used = 0; }
    lines += Math.floor(Math.max(0, length - 1) / capacity);
    used = (used ? used + 1 : 0) + (length % capacity || capacity);
  }
  return lines;
}

export function KitchenMenuPdfDocument({ menu, logo }: MenuPdfDocumentProps) {
  const entries = menuEntries(menu);
  const midpoint = Math.ceil(entries.length / 2);
  const left = entries.slice(0, midpoint);
  const right = entries.slice(midpoint);
  const pages: { left: Entry; right?: Entry }[][] = [[]];
  let height = 0;
  left.forEach((entry, index) => {
    const other = right[index];
    const lines = Math.max(lineCount(entry.label, 18), lineCount(entry.value, 22), lineCount(other?.label ?? "", 18), lineCount(other?.value ?? "", 22));
    const rowHeight = Math.max(23, lines * 13 + 10);
    if (height + rowHeight > 580 && pages[pages.length - 1].length) {
      pages.push([]);
      height = 0;
    }
    pages[pages.length - 1].push({ left: entry, right: other });
    height += rowHeight;
  });
  const logoWidth = 230;
  return (
    <Document title={`${menu.name} - Kitchen`} author="Dhanlaxmi Caterer">
      {pages.map((rows, pageIndex) => <Page key={pageIndex} size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logo.src} style={{ width: logoWidth, height: logoWidth * logo.headerHeight / logo.headerWidth }} />
          <Text style={styles.title}>{menu.name}</Text>
        </View>
        <View style={styles.table}>
          {rows.map((row, index) => (
            <View key={index} style={styles.row} wrap={false}>
              <Cells entry={row.left} /><Cells entry={row.right} />
            </View>
          ))}
        </View>
        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </Page>)}
    </Document>
  );
}
