import { Document, Image as PdfImage, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { isHiTeaCategory } from "./hi-tea";
import type { OrderForPdf } from "./order-pdf";

const styles = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingBottom: 40,
    paddingHorizontal: 32,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  header: {
    position: "absolute",
    top: 14,
    left: 32,
    right: 32,
    height: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.75,
    borderBottomColor: "#888888",
    paddingBottom: 4,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111111",
    letterSpacing: 0.5,
  },
  titleBlock: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111111",
    marginBottom: 2,
  },
  detailsBox: {
    borderWidth: 0.75,
    borderColor: "#777777",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  detailRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  detailCol: {
    width: "50%",
    paddingRight: 8,
    flexDirection: "row",
  },
  detailColFull: {
    width: "100%",
    flexDirection: "row",
    marginTop: 3,
  },
  detailLabel: {
    fontWeight: 700,
    color: "#111111",
    fontSize: 10,
    marginRight: 4,
  },
  detailValue: {
    color: "#111111",
    fontSize: 10,
    flexShrink: 1,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryHeader: {
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 0.75,
    borderBottomColor: "#CCCCCC",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#111111",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dishRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  dishCol: {
    width: "50%",
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dishColSingle: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: 9,
    color: "#333333",
    marginRight: 5,
    marginTop: 0.5,
  },
  dishName: {
    fontSize: 9.5,
    color: "#111111",
    lineHeight: 1.3,
  },
  hiTeaNotesBox: {
    marginTop: 4,
    marginBottom: 4,
    marginHorizontal: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 0.5,
    borderColor: "#AAAAAA",
    backgroundColor: "#FAFAFA",
  },
  hiTeaNotesLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#222222",
    marginBottom: 1,
  },
  hiTeaNotesText: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.3,
  },
  noMenuText: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#666666",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: "#888888",
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: "#555555",
  },
});

function formatOrderDate(date: string | null | undefined): string {
  if (!date) return "—";
  const str = String(date).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10).split("-").reverse().join("/");
  }
  return str;
}

function formatMealType(meal: string | null | undefined): string {
  if (!meal) return "—";
  return meal.charAt(0).toUpperCase() + meal.slice(1).toLowerCase();
}

type CategoryGroup = {
  id: number;
  name: string;
  dishes: { id: number; name: string }[];
};

export function OrderMenuPdfDocument({
  order,
  logo,
}: {
  order: OrderForPdf;
  logo: PdfLogoAssets | null;
}) {
  const customerNames = [order.customerName?.trim(), order.customer2Name?.trim()].filter(Boolean).join(" & ") || "Customer";
  const totalPlates = (order.numberOfPersons ?? 0) + (order.extraPlates ?? 0);
  const logoWidth = logo ? Math.min(90, logo.headerWidth) : 0;

  // Group dishes by category
  const categoryMap = new Map<number, CategoryGroup>();
  for (const dish of order.menuDishes) {
    let cat = categoryMap.get(dish.categoryId);
    if (!cat) {
      cat = { id: dish.categoryId, name: dish.categoryName, dishes: [] };
      categoryMap.set(dish.categoryId, cat);
    }
    cat.dishes.push({ id: dish.dishId, name: dish.name });
  }
  const categories = [...categoryMap.values()];

  const hiTeaNotes = order.hiTeaNotes?.trim() || "";
  const hasHiTeaCategory = categories.some((c) => isHiTeaCategory(c.name));

  return (
    <Document title={`${customerNames} - Menu`} author="Dhanlaxmi Caterer">
      <Page size="A4" style={styles.page}>
        {/* Fixed Header */}
        <View style={styles.header} fixed>
          <Text style={styles.headerLabel}>DHANLAXMI CATERER</Text>
          {logo ? (
            <PdfImage
              src={logo.src}
              style={{
                width: logoWidth,
                height: Math.min(24, (logoWidth * logo.headerHeight) / logo.headerWidth),
                objectFit: "contain",
              }}
            />
          ) : (
            <Text style={{ fontSize: 9, color: "#666666" }}>SELECTED MENU</Text>
          )}
        </View>

        {/* Title & Order Details */}
        <View wrap={false} style={styles.titleBlock}>
          <Text style={styles.title}>{customerNames} - Menu</Text>
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatOrderDate(order.date)}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Meal:</Text>
                <Text style={styles.detailValue}>{formatMealType(order.mealType)}</Text>
              </View>
            </View>
            <View style={styles.detailColFull}>
              <Text style={styles.detailLabel}>Venue:</Text>
              <Text style={styles.detailValue}>{order.venue || "—"}</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Plates:</Text>
                <Text style={styles.detailValue}>
                  {totalPlates > 0
                    ? order.extraPlates && order.extraPlates > 0
                      ? `${totalPlates} (${order.numberOfPersons} + ${order.extraPlates} extra)`
                      : `${totalPlates}`
                    : "—"}
                </Text>
              </View>
              {order.orderId ? (
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>{order.orderId}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Menu Categories & Dishes */}
        {categories.length > 0 ? (
          categories.map((category) => {
            const isHiTea = isHiTeaCategory(category.name);
            const isSingle = category.dishes.length === 1;
            const columns = isSingle ? 1 : 2;
            const rows = Array.from(
              { length: Math.ceil(category.dishes.length / columns) },
              (_, i) => category.dishes.slice(i * columns, (i + 1) * columns)
            );

            return (
              <View key={category.id} style={styles.categorySection} wrap={false}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                </View>
                {rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.dishRow}>
                    {row.map((dish) => (
                      <View
                        key={dish.id}
                        style={isSingle ? styles.dishColSingle : styles.dishCol}
                      >
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.dishName}>{dish.name}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                {isHiTea && hiTeaNotes ? (
                  <View style={styles.hiTeaNotesBox}>
                    <Text style={styles.hiTeaNotesLabel}>Hi-tea Notes:</Text>
                    <Text style={styles.hiTeaNotesText}>{hiTeaNotes}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.noMenuText}>No dishes selected yet.</Text>
        )}

        {/* If Hi-tea notes exist without a Hi-tea category */}
        {!hasHiTeaCategory && hiTeaNotes ? (
          <View style={styles.categorySection} wrap={false}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Hi-tea Notes</Text>
            </View>
            <View style={styles.hiTeaNotesBox}>
              <Text style={styles.hiTeaNotesText}>{hiTeaNotes}</Text>
            </View>
          </View>
        ) : null}

        {/* Fixed Footer */}
        <View style={styles.footer} fixed>
          <Text>Dhanlaxmi Caterer</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
