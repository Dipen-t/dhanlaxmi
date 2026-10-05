import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { MenuDetail } from "@/app/menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";

import { getCategoryImageKey, type CategoryPhotoSources } from "../category-images";

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

const getStyles = (primaryFont: string, scale: number) => StyleSheet.create({
  page: {
    backgroundColor: colors.cream,
    paddingTop: HEADER_CLEARANCE,
    paddingBottom: 44,
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    fontFamily: primaryFont,
    fontSize: 10 * scale,
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
    fontFamily: primaryFont,
    fontSize: 28 * scale,
    color: colors.tealDeep,
    marginBottom: 2,
    textAlign: "center",
  },
  menuSubtitle: {
    fontFamily: primaryFont,
    fontSize: 10 * scale,
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
    fontSize: 8.5 * scale,
    fontFamily: primaryFont,
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
    fontFamily: primaryFont,
    fontSize: 9.5 * scale,
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
    fontFamily: primaryFont,
    fontWeight: 600,
    fontSize: 12 * scale,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: colors.tealDeep,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  selectionRule: {
    fontFamily: primaryFont,
    fontSize: 9 * scale,
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
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    paddingVertical: 4,
  },
  dishItemSingleColumn: {
    width: "100%",
  },
  checkbox: {
    width: 11 * scale,
    height: 11 * scale,
    borderWidth: 1.2,
    borderColor: colors.tealDeep,
    marginRight: 5,
    borderRadius: 1.5,
    backgroundColor: colors.white,
  },
  dishName: {
    flex: 1,
    fontSize: 9.5 * scale,
    fontFamily: primaryFont,
    color: colors.ink,
    lineHeight: 1.35,
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
    fontFamily: primaryFont,
    fontSize: 10 * scale,
    color: colors.tealDeep,
  },
  footerPage: {
    fontFamily: primaryFont,
    fontSize: 7 * scale,
    color: colors.muted,
  },
});

type MenuPdfDocumentProps = {
  menu: MenuDetail;
  logo: PdfLogoAssets;
  config?: { fontFamily: string; fontSize: string };
  categoryPhotos: CategoryPhotoSources;
};

function PageHeader({ logo, styles }: { logo: PdfLogoAssets, styles: ReturnType<typeof getStyles> }) {
  return (
    <View style={styles.pageHeader} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML element. */}
      <Image
        src={logo.src}
        style={{ width: logo.headerWidth, height: logo.headerHeight }}
      />
    </View>
  );
}

function CategorySection({
  category,
  styles,
  categoryPhotos,
}: {
  category: MenuDetail["categories"][number];
  styles: ReturnType<typeof getStyles>;
  categoryPhotos: CategoryPhotoSources;
}) {
  const key = getCategoryImageKey(category);
  const photo = key ? categoryPhotos[key] : undefined;
  const useSingleColumn = category.dishes.length <= 3;

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

      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <View style={[styles.dishGrid, { flex: 1 }]}>
        {category.dishes.map((dish) => (
          <View
            key={dish.id}
            style={
              useSingleColumn
                ? [styles.dishItem, styles.dishItemSingleColumn]
                : styles.dishItem
            }
          >
            <View style={styles.checkbox} />
            <Text style={styles.dishName}>{dish.name}</Text>
          </View>
        ))}
      </View>
      {photo ? <View style={{ width: 148, height: 100, marginLeft: 14, overflow: "hidden", borderRadius: 6, borderWidth: 0.5, borderColor: colors.tealLine, backgroundColor: "#120c07" }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML element. */}
        <Image src={photo} style={{ width: 148, height: 100, objectFit: "contain" }} />
      </View> : null}
      </View>
    </View>
  );
}

export function MenuPdfDocument({ menu, logo, config, categoryPhotos }: MenuPdfDocumentProps) {
  const primaryFont = config?.fontFamily || "SourceSans";
  const baseSize = config?.fontSize === "12pt" ? 12 : config?.fontSize === "14pt" ? 14 : 10;
  const scale = baseSize / 10;
  
  const styles = getStyles(primaryFont, scale);

  return (
    <Document title={menu.name} author="Dhalaxmi Catering Service">
      <Page size="A4" style={styles.page}>
        <PageHeader logo={logo} styles={styles} />

        <View style={styles.coverSection} wrap={false}>
          <View style={styles.coverBody}>
            <Text style={styles.menuTitle}>{menu.name}</Text>
            <Text style={styles.menuSubtitle}>Catering Menu Proposal</Text>

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
          Tick your choices in each category as per the limit shown.
        </Text>

        {menu.categories.map((category) => (
          <CategorySection key={category.id} category={category} styles={styles} categoryPhotos={categoryPhotos} />
        ))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>Dhalaxmi Catering Service</Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) =>
              `${menu.name}  ·  Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
