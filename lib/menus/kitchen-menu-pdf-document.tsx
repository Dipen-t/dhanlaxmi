import { Document, Image as PdfImage, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { KitchenMenuDetail } from "@/app/kitchen-menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { formatDeliveryTime } from "@/lib/kitchen-menus/delivery-time";
import { eventDateString } from "@/lib/orders/event-date";
import { formatDateDisplay } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { paddingTop: 50, paddingBottom: 38, paddingHorizontal: 30, fontFamily: "SourceSans", fontSize: 11, color: "#111111", backgroundColor: "#FFFFFF" },
  header: { position: "absolute", top: 12, left: 30, right: 30, height: 26, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 0.5, borderBottomColor: "#999999", paddingBottom: 5 },
  headerLabel: { fontSize: 10, fontWeight: 700 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  details: { borderWidth: 0.5, borderColor: "#777777", padding: 8, marginBottom: 12 },
  detailRow: { flexDirection: "row", marginTop: 4 },
  detail: { width: "50%", paddingRight: 10, lineHeight: 1.3 },
  venue: { lineHeight: 1.3, marginTop: 4 },
  bold: { fontWeight: 700 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#DDDDDD" },
  cell: { width: "50%", paddingHorizontal: 7, paddingVertical: 3 },
  fullCell: { width: "100%" },
  dish: { lineHeight: 1.3 },
  quantity: { fontWeight: 700 },
  footer: { position: "absolute", bottom: 14, left: 30, right: 30, borderTopWidth: 0.5, borderTopColor: "#999999", paddingTop: 5, flexDirection: "row", justifyContent: "space-between", fontSize: 9 },
});

type Category = KitchenMenuDetail["categories"][number];

function DishRow({ dishes, single }: { dishes: Category["dishes"]; single: boolean }) {
  return (
    <View style={styles.row} wrap={false}>
      {dishes.map(dish => (
        <View key={dish.id} style={single ? [styles.cell, styles.fullCell] : styles.cell}>
          <Text style={styles.dish}>
            {dish.name}{dish.quantity ? <Text style={styles.quantity}>{` — ${dish.quantity}`}</Text> : null}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DishRows({ category }: { category: Category }) {
  // Quantities need room; ordinary dishes use two readable columns.
  const single = category.isQtyField || category.dishes.length === 1;
  const columns = single ? 1 : 2;
  const rows = Array.from({ length: Math.ceil(category.dishes.length / columns) }, (_, index) => category.dishes.slice(index * columns, (index + 1) * columns));
  return (
    <View>
      {rows.map((row, index) => <DishRow key={index} dishes={row} single={single} />)}
    </View>
  );
}

export function KitchenMenuPdfDocument({ menu, logo }: { menu: KitchenMenuDetail; logo: PdfLogoAssets }) {
  const deliveryTime = formatDeliveryTime(menu.deliveryTime);
  const logoWidth = Math.min(90, logo.headerWidth);
  return (
    <Document title={`${menu.name} - Kitchen`} author="Dhanlaxmi Caterer">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.headerLabel}>KITCHEN MENU</Text>
          <PdfImage src={logo.src} style={{ width: logoWidth, height: Math.min(24, logoWidth * logo.headerHeight / logo.headerWidth), objectFit: "contain" }} />
        </View>
        <View wrap={false}>
          <Text style={styles.title}>{menu.name}</Text>
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={styles.detail}><Text style={styles.bold}>Date: </Text>{menu.date ? formatDateDisplay(eventDateString(new Date(menu.date))) : "—"}</Text>
              <Text style={styles.detail}><Text style={styles.bold}>Meal: </Text>{menu.mealType || "—"}</Text>
            </View>
            <Text style={styles.venue}><Text style={styles.bold}>Venue: </Text>{menu.venue || "—"}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detail}><Text style={styles.bold}>Persons: </Text>{menu.numberOfPersons ?? "—"}</Text>
              <Text style={styles.detail}><Text style={styles.bold}>Deliver by: </Text>{deliveryTime || "—"}</Text>
            </View>
          </View>
        </View>
        {menu.categories.filter(category => category.dishes.length > 0).map((category, index) => <DishRows key={`${category.id}-${index}`} category={category} />)}
        <View style={styles.footer} fixed>
          <Text>Dhanlaxmi Caterer</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
