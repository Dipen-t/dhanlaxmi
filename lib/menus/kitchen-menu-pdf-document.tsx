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
    fontFamily: "Playball",
    fontSize: 28,
    color: colors.tealDeep,
    marginBottom: 2,
    textAlign: "center",
  },
  menuSubtitle: {
    fontFamily: "Cormorant",
    fontSize: 10,
    fontStyle: "italic",
    color: colors.muted,
    letterSpacing: 0.6,
    marginBottom: 12,
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
    minWidth: 56,
  },
  sectionIntro: {
    fontFamily: "Cormorant",
    fontSize: 9.5,
    fontStyle: "italic",
    color: colors.muted,
    marginTop: 6,
    marginBottom: 14,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  categoryBlock: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
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
    flex: 1,
    height: 1,
    backgroundColor: colors.tealLine,
  },
  categoryName: {
    fontFamily: "Cormorant",
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: colors.tealDeep,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  selectionRule: {
    fontFamily: "Cormorant",
    fontSize: 9,
    fontStyle: "italic",
    color: colors.muted,
    marginTop: 3,
    textAlign: "center",
  },
  dishGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 2,
  },
  dishItem: {
    width: "14.28%",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
    paddingVertical: 4,
  },
  dishItemSingleColumn: {
    width: "100%",
  },
  checkbox: {
    width: 11,
    height: 11,
    borderWidth: 1.2,
    borderColor: colors.tealDeep,
    marginRight: 5,
    borderRadius: 1.5,
    backgroundColor: colors.white,
  },
  qtyField: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 5,
  },
  qtyLabel: {
    fontSize: 8,
    color: colors.tealDeep,
    marginRight: 2,
  },
  qtyLine: {
    width: 25,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
    marginBottom: 1,
  },
  dishName: {
    fontSize: 9.5,
    fontFamily: "SourceSans",
    color: colors.ink,
    lineHeight: 1.1,
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
    fontFamily: "Playball",
    fontSize: 10,
    color: colors.tealDeep,
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
          <View style={styles.flankLine} />
          <Text style={styles.categoryName}>{category.name}</Text>
          <View style={styles.flankLine} />
        </View>
        <Text style={styles.selectionRule}>{category.selectionRule}</Text>
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
            {isQtyField ? (
              <>
                <Text style={styles.dishName}>{dish.name}</Text>
                <View style={styles.qtyField}>
                  <Text style={[styles.qtyLabel, { marginLeft: 2 }]}>Qty</Text>
                  <View style={styles.qtyLine} />
                </View>
              </>
            ) : (
              <>
                <View style={styles.checkbox} />
                <Text style={styles.dishName}>{dish.name}</Text>
              </>
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
              <View style={styles.fieldsRow}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Per Pax:</Text>
                  <View style={styles.fieldLine} />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Rate:</Text>
                  <View style={styles.fieldLine} />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Date:</Text>
                  <View style={styles.fieldLine} />
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionIntro}>
          Kitchen preparation sheet. Mark dishes and note down required quantities.
        </Text>

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
