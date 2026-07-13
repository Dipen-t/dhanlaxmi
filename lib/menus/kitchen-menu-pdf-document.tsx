import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { KitchenMenuDetail } from "@/app/kitchen-menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";

const PAGE_HORIZONTAL_PADDING = 36;
const HEADER_CLEARANCE = 58;

const colors = {
  white: "#FFFFFF",
  cream: "#FFFFFF",
  ink: "#000000",
  muted: "#333333",
  teal: "#000000",
  tealDeep: "#000000",
  tealLine: "#000000",
  rule: "#000000",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.cream,
    paddingTop: HEADER_CLEARANCE,
    paddingBottom: 44,
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    fontFamily: "SourceSans",
    fontSize: 10,
    color: colors.ink,
  },
  pageHeader: {
    position: "absolute",
    top: 14,
    left: PAGE_HORIZONTAL_PADDING,
    right: PAGE_HORIZONTAL_PADDING,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  coverSection: {
    marginBottom: 12,
    alignItems: "center",
  },
  coverBody: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  menuTitle: {
    fontFamily: "SourceSans",
    fontSize: 24,
    fontWeight: 700,
    color: colors.ink,
    marginBottom: 4,
    textAlign: "center",
  },
  menuSubtitle: {
    fontFamily: "SourceSans",
    fontSize: 12,
    color: colors.ink,
    marginBottom: 16,
    textAlign: "center",
  },
  fieldsCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
    width: "100%",
  },
  fieldsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 8.5,
    fontFamily: "SourceSans",
    fontWeight: 600,
    color: colors.teal,
    marginRight: 5,
  },
  fieldLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    marginBottom: 2,
    minWidth: 40,
  },
  fieldValue: {
    fontSize: 9.5,
    fontFamily: "SourceSans",
    color: colors.ink,
    marginLeft: 4,
  },
  sectionIntro: {
    display: "none",
  },
  categoryBlock: {
    marginBottom: 4,
  },
  categoryHeader: {
    marginBottom: 7,
  },
  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  flankLine: {
    display: "none",
  },
  categoryName: {
    fontFamily: "SourceSans",
    fontWeight: 700,
    fontSize: 14,
    textTransform: "uppercase",
    color: colors.ink,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  selectionRule: {
    display: "none",
  },
  dishGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 2,
  },
  dishItem: {
    width: "33.33%",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    paddingVertical: 5,
  },
  dishItemSingleColumn: {
    width: "100%",
  },
  dishQuantity: {
    fontSize: 10,
    fontFamily: "SourceSans",
    color: colors.tealDeep,
    marginLeft: 4,
    fontWeight: 600,
  },
  dishName: {
    fontSize: 10.5,
    fontFamily: "SourceSans",
    color: colors.ink,
    lineHeight: 1.2,
  },
  counterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5,
  },
  counterItem: {
    width: "33.33%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  counterName: {
    fontSize: 9.5,
    fontFamily: "SourceSans",
    color: colors.ink,
    marginRight: 4,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: PAGE_HORIZONTAL_PADDING,
    right: PAGE_HORIZONTAL_PADDING,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.tealLine,
    paddingTop: 5,
  },
  footerBrand: {
    fontFamily: "SourceSans",
    fontSize: 10,
    color: colors.ink,
  },
  footerPage: {
    fontFamily: "SourceSans",
    fontSize: 7,
    color: colors.muted,
  },
});

type MenuPdfDocumentProps = {
  menu: KitchenMenuDetail;
  logo: PdfLogoAssets;
};

function PageHeader({ logo }: { logo: PdfLogoAssets }) {
  return (
    <View style={styles.pageHeader} fixed>
      <Image
        src={logo.src}
        style={{ width: logo.headerWidth, height: logo.headerHeight }}
      />
    </View>
  );
}

function CategorySection({
  category,
}: {
  category: KitchenMenuDetail["categories"][number];
}) {
  const useSingleColumn = category.dishes.length <= 3;
  const isQtyField = category.isQtyField;

  return (
    <View style={styles.categoryBlock} wrap={false}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryTitleRow}>
          <Text style={styles.categoryName}>{category.name}</Text>
        </View>
      </View>

      <View style={styles.dishGrid}>
        {category.dishes.map((dish) => (
          <View
            key={dish.id}
            style={
              useSingleColumn
                ? [styles.dishItem, styles.dishItemSingleColumn]
                : styles.dishItem
            }
          >
            {dish.quantity ? (
              <>
                <Text style={styles.dishName}>{dish.name}</Text>
                <Text style={styles.dishQuantity}>- {dish.quantity}</Text>
              </>
            ) : (
              <Text style={styles.dishName}>{dish.name}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export function KitchenMenuPdfDocument({ menu, logo }: MenuPdfDocumentProps) {
  return (
    <Document title={`${menu.name} - Kitchen`} author="Dhalaxmi Catering Service">
      <Page size="A4" style={styles.page}>
        <PageHeader logo={logo} />

        <View style={styles.coverSection} wrap={false}>
          <View style={styles.coverBody}>
            <Text style={styles.menuTitle}>{menu.name}</Text>
            <Text style={styles.menuSubtitle}>Kitchen Operations Menu</Text>

            <View style={styles.fieldsCard}>
              <View style={[styles.fieldsRow, { marginBottom: 8 }]}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Venue:</Text>
                  {menu.venue ? (
                    <Text style={styles.fieldValue}>{menu.venue}</Text>
                  ) : (
                    <View style={styles.fieldLine} />
                  )}
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Date:</Text>
                  {menu.date ? (
                    <Text style={styles.fieldValue}>{new Date(menu.date).toLocaleDateString()}</Text>
                  ) : (
                    <View style={styles.fieldLine} />
                  )}
                </View>
              </View>
              <View style={styles.fieldsRow}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Persons:</Text>
                  {menu.numberOfPersons ? (
                    <Text style={styles.fieldValue}>{menu.numberOfPersons}</Text>
                  ) : (
                    <View style={styles.fieldLine} />
                  )}
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Meal:</Text>
                  {menu.mealType ? (
                    <Text style={styles.fieldValue}>{menu.mealType}</Text>
                  ) : (
                    <View style={styles.fieldLine} />
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {menu.categories.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>Dhalaxmi Catering Service</Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) =>
              `${menu.name} (Kitchen)  ·  Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
