import path from "node:path";
import { getCategoryImageKey, type CategoryPhotoSources } from "../category-images";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MenuDetail } from "@/app/menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";

// Each reference panel is a separate portrait PDF page, not a spread.
const WIDTH = 300;
const HEIGHT = 600;
const ARTWORK_WIDTH = WIDTH * 3;
const BODY_SIZE = 9;
const LINE_HEIGHT = 11;
const gold = "#976923";
let registered = false;

export function registerBotanicalFonts() {
  if (registered) return;
  Font.register({ family: "MenuScript", src: path.join(process.cwd(), "public/fonts/menu/playball-regular.ttf") });
  registered = true;
}

const styles = StyleSheet.create({
  page: { minHeight: HEIGHT, fontFamily: "Times-Roman", color: "#201e19", backgroundColor: "#f8f5ee" },
  backgroundFrame: { position: "absolute", top: 0, left: 0, width: WIDTH, height: HEIGHT, overflow: "hidden" },
  background: { position: "absolute", top: 0, width: ARTWORK_WIDTH, height: HEIGHT },
  cover: { position: "absolute", top: 28, left: 24, width: 252, alignItems: "center" },
  tagline: { fontSize: 6.3, letterSpacing: 1.6, textAlign: "center", marginTop: 8 },
  rule: { height: 0.5, backgroundColor: gold, width: 196, marginTop: 9 },
  premium: { fontSize: 10, letterSpacing: 4, marginTop: 30 },
  title: { fontSize: 26, lineHeight: 1.1, textAlign: "center", marginTop: 6 },
  menuLabel: { fontSize: 15, letterSpacing: 6, marginTop: 6 },
  description: { fontSize: 6.5, letterSpacing: 1.5, lineHeight: 1.7, textAlign: "center", marginTop: 14 },
  script: { fontFamily: "MenuScript", fontSize: 17, color: "#635947", textAlign: "center" },
  coverQuote: { position: "absolute", top: 294, left: 169, width: 101 },
  events: { position: "absolute", bottom: 52, left: 31, width: 238, flexDirection: "row", justifyContent: "space-between" },
  event: { width: 56, textAlign: "center", color: gold, fontSize: 6.3, lineHeight: 1.6, letterSpacing: 0.6 },
  happiness: { position: "absolute", bottom: 28, left: 30, width: 240, fontSize: 7, letterSpacing: 2, textAlign: "center" },
  note: { position: "absolute", top: 24, left: 166, width: 111, textAlign: "right", fontSize: 6.1, letterSpacing: 1.2, lineHeight: 1.6 },
  section: { position: "absolute" },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 7 },
  number: { fontSize: 32, color: gold, width: 39, lineHeight: 1 },
  heading: { fontFamily: "Times-Bold", fontSize: 11.6, lineHeight: 1.1, textTransform: "uppercase" },
  selection: { fontSize: 9, letterSpacing: 0.6, marginTop: 3, textTransform: "uppercase" },
  headingRule: { height: 0.5, backgroundColor: gold, width: 65, marginTop: 5 },
  dishes: { flexDirection: "row", flexWrap: "wrap" },
  dish: { flexDirection: "row", alignItems: "flex-start", paddingRight: 4 },
  bullet: { color: gold, width: 8, fontSize: 8.5, lineHeight: LINE_HEIGHT / 8.5 },
  dishName: { fontSize: BODY_SIZE, lineHeight: LINE_HEIGHT / BODY_SIZE },
  bottomCaption: { position: "absolute", bottom: 17, width: 172, fontFamily: "MenuScript", fontSize: 13, textAlign: "center", color: "#635947" },
  pageNumber: { position: "absolute", bottom: 7, right: 20, fontSize: 5.5, color: gold },
});

const burgundyStyles: typeof styles = StyleSheet.create({
  ...styles,
  page: { ...styles.page, color: "#fff3dc", backgroundColor: "#250301" },
  rule: { ...styles.rule, backgroundColor: "#edca7e" },
  title: { ...styles.title, fontFamily: "Times-Bold", color: "#f4d78f" },
  script: { ...styles.script, color: "#f0cc7d" },
  event: { ...styles.event, color: "#fff3dc" },
  number: { ...styles.number, fontFamily: "Times-Bold", color: "#f4d78f" },
  headingRule: { ...styles.headingRule, backgroundColor: "#edca7e" },
  bullet: { ...styles.bullet, color: "#f4d78f" },
  bottomCaption: { ...styles.bottomCaption, color: "#f0cc7d" },
  pageNumber: { ...styles.pageNumber, color: "#f0cc7d" },
});

const emeraldStyles: typeof styles = StyleSheet.create({
  ...burgundyStyles,
  page: { ...burgundyStyles.page, backgroundColor: "#021b12" },
  cover: { ...styles.cover, top: 54 },
});

const artDecoStyles: typeof styles = StyleSheet.create({
  ...burgundyStyles,
  page: { ...burgundyStyles.page, backgroundColor: "#060605" },
  cover: { ...styles.cover, top: 45 },
  premium: { ...styles.premium, marginTop: 22 },
  coverQuote: { ...styles.coverQuote, top: 320 },
  dishName: { ...styles.dishName, fontSize: 8.5, lineHeight: 10 / 8.5 },
  bullet: { ...burgundyStyles.bullet, lineHeight: 10 / 8.5 },
  bottomCaption: { ...burgundyStyles.bottomCaption, backgroundColor: "#080807", paddingVertical: 2, fontSize: 12 },
});

type Category = MenuDetail["categories"][number];
type Section = { category: Category; number: number; continued: boolean; dishes: string[][]; columns: number; lineBudget: number; headingLines: string[]; selectionLines: string[]; headingSize: number; headerHeight: number; headerWidth: number; top: number; photoHeight: number };

// Explicit wrapping makes capacity predictable before laying out the fixed panels.
function wrapName(name: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  let measured = 0;
  const measure = (word: string) => Array.from(word).reduce((sum, char) =>
    sum + (/[MW@]/.test(char) ? 0.85 : /[ilI.,' ]/.test(char) ? 0.28 : /[A-Z]/.test(char) ? 0.67 : 0.5) * BODY_SIZE, 0);
  for (const word of name.trim().split(/\s+/)) {
    const wordWidth = measure(word);
    if (line && measured + wordWidth + 2.5 > width) { lines.push(line); line = ""; measured = 0; }
    // Split unusually long unbroken names instead of letting them spill over the artwork.
    if (wordWidth > width) {
      let part = "";
      let partWidth = 0;
      for (const char of word) {
        const charWidth = measure(char);
        if (partWidth + charWidth > width && part) { lines.push(part); part = ""; partWidth = 0; }
        part += char; partWidth += charWidth;
      }
      line = part; measured = partWidth;
    } else { measured += wordWidth + (line ? 2.5 : 0); line += (line ? " " : "") + word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export function createBotanicalSections(categories: Category[], artDeco = false): Section[] {
  const sections: Section[] = [];
  categories.forEach((category, index) => {
    const remaining = category.dishes.map(dish => dish.name);
    let continued = false;
    do {
      const slot = sections.length % 6;
      // Each category owns its photograph; reserve the right side for it.
      const columns = 1;
      const hasPhoto = !!getCategoryImageKey(category);
      const textWidth = hasPhoto ? 118 : 252;
      // Headings use the complete band above each category photo.
      const headerWidth = 268;
      const headingSize = category.name.length > 20 ? 10.2 : 11.6;
      const headingLines = wrapName(`${category.name.toUpperCase()}${continued ? " (CONT.)" : ""}`, (headerWidth - 43) * BODY_SIZE / headingSize * 0.93);
      const selectionLines = category.selectionRule ? wrapName(`(${category.selectionRule.toUpperCase()})`, (headerWidth - 43) * 0.86) : [];
      const headerHeight = Math.max(32, headingLines.length * headingSize * 1.1 + (selectionLines.length ? selectionLines.length * 10 + 3 : 0) + 6) + 7;
      const top = (artDeco ? [32, 232, 403] : [52, 224, 388])[slot % 3];
      const availableHeight = (artDeco ? [181, 160, 152] : [160, 160, 167])[slot % 3];
      const lineBudget = Math.max(1, Math.floor((availableHeight - headerHeight) / (artDeco ? 10 : LINE_HEIGHT)));
      const photoHeight = Math.max(40, Math.min(94, availableHeight - headerHeight));
      const chosen: string[][] = [];
      let used = 0;
      while (remaining.length) {
        const lines = wrapName(remaining[0], textWidth);
        const cost = Math.min(lines.length, lineBudget);
        if (used + cost > lineBudget) break;
        chosen.push(lines.slice(0, lineBudget));
        // Preserve very long names across continuation blocks as well.
        if (lines.length > lineBudget) remaining[0] = lines.slice(lineBudget).join(" ");
        else remaining.shift();
        used += cost;
      }
      sections.push({ category, number: index + 1, continued, dishes: chosen, columns, lineBudget, headingLines, selectionLines, headingSize, headerHeight, headerWidth, top, photoHeight });
      continued = true;
    } while (remaining.length);
  });
  return sections;
}

function CategorySection({ section, styles, categoryPhotos }: { section: Section; styles: typeof burgundyStyles; categoryPhotos: CategoryPhotoSources }) {
  const key = getCategoryImageKey(section.category);
  const photo = key ? categoryPhotos[key] : undefined;
  const width = photo ? 134 : 268;
  // Lists read down each column, matching the printed reference.
  const columnLists: string[][][] = [[]];
  let used = 0;
  for (const lines of section.dishes) {
    if (section.columns === 2 && used + lines.length > section.lineBudget && columnLists.length === 1) { columnLists.push([]); used = 0; }
    columnLists[columnLists.length - 1].push(lines); used += lines.length;
  }
  return <View style={[styles.section, { left: 15, top: section.top, width: 268 }]}>
    <View style={[styles.header, { width: section.headerWidth, height: section.headerHeight - 7 }]}>
      <Text style={styles.number}>{String(section.number).padStart(2, "0")}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.heading, { fontSize: section.headingSize }]}>{section.headingLines.join("\n")}</Text>
        {section.category.selectionRule ? <Text style={[styles.selection, { lineHeight: 10 / 9 }]}>{section.selectionLines.join("\n")}</Text> : null}
        <View style={styles.headingRule} />
      </View>
    </View>
    {photo ? <View style={{ position: "absolute", left: 138, top: section.headerHeight, width: 130, height: section.photoHeight, overflow: "hidden", borderRadius: 5, borderWidth: 0.5, borderColor: gold, backgroundColor: "#120c07" }}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML element. */}
      <Image src={photo} style={{ width: 130, height: section.photoHeight, objectFit: "contain" }} />
    </View> : null}
    <View style={{ flexDirection: "row", width }}>
      {columnLists.map((list, column) => <View key={column} style={{ width: width / section.columns }}>
        {list.map((lines, index) => <View key={index} style={styles.dish}>
          <Text style={styles.bullet}>•</Text>
          <Text style={[styles.dishName, { width: width / section.columns - 16 }]}>{lines.join("\n")}</Text>
        </View>)}
      </View>)}
    </View>
  </View>;
}

function PageArtwork({ background, panel }: { background: string; panel: number }) {
  // Clip the existing artwork during PDF rendering; keep the source image intact.
  return <View style={styles.backgroundFrame}>
    {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML element. */}
    <Image src={background} style={[styles.background, { left: -WIDTH * panel }]} />
  </View>;
}

export function IvoryBotanicalPdfDocument({ menu, logo, background, contentBackground, categoryPhotos, theme = "ivory-botanical" }: { menu: MenuDetail; logo: PdfLogoAssets; background: string; contentBackground: string; categoryPhotos: CategoryPhotoSources; theme?: "ivory-botanical" | "burgundy-gold" | "emerald-gold" | "art-deco-gold" }) {
  const themeStyles = theme === "art-deco-gold" ? artDecoStyles : theme === "emerald-gold" ? emeraldStyles : theme === "burgundy-gold" ? burgundyStyles : styles;
  // Artwork themes share pagination and positioning while retaining their own palette.
  const middleCaption = theme === "emerald-gold" || theme === "art-deco-gold" ? "Timeless Favourites\nAlways a Good Idea" : "Crafted with Passion\nServed with Love";
  return <ArtworkMenuPdfDocument menu={menu} logo={logo} background={background} contentBackground={contentBackground} categoryPhotos={categoryPhotos} styles={themeStyles} middleCaption={middleCaption} emerald={theme === "emerald-gold"} artDeco={theme === "art-deco-gold"} />;
}

function ArtworkMenuPdfDocument({ menu, logo, background, contentBackground, categoryPhotos, styles, middleCaption, emerald, artDeco }: { menu: MenuDetail; logo: PdfLogoAssets; background: string; contentBackground: string; categoryPhotos: CategoryPhotoSources; styles: typeof burgundyStyles; middleCaption: string; emerald: boolean; artDeco: boolean }) {
  const sections = createBotanicalSections(menu.categories, artDeco);
  const logoWidth = emerald ? 228 : 252;
  const contentPageCount = Math.ceil(sections.length / 3);
  const pageCount = 1 + contentPageCount;
  return <Document title={menu.name} author="Dhanlaxmi Catering Service">
    <Page size={[WIDTH, HEIGHT]} style={styles.page} wrap={false}>
      <PageArtwork background={background} panel={0} />
      <View style={styles.cover}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML element. */}
        <Image src={logo.src} style={{ width: logoWidth, height: logoWidth * logo.headerHeight / logo.headerWidth }} />
        <Text style={styles.tagline}>TASTE  ·  TRADITION  ·  TOGETHERNESS</Text>
        <View style={styles.rule} />
        <Text style={styles.premium}>PREMIUM</Text>
        <Text style={[styles.title, { fontSize: menu.name.length > 36 ? 17 : menu.name.length > 22 ? 21 : 26 }]}>{menu.name.toUpperCase()}</Text>
        {!/\bmenu\s*$/i.test(menu.name) ? <Text style={styles.menuLabel}>MENU</Text> : null}
        <Text style={styles.description}>{artDeco ? "FLAVOURS THAT BRING\nPEOPLE TOGETHER" : "EXQUISITE FLAVOURS\nFOR MEMORABLE CELEBRATIONS"}</Text>
      </View>
      <Text style={[styles.script, styles.coverQuote]}>{artDeco ? "Sip\nSocialize\nCelebrate" : "Good Food\nBrings People\nTogether"}</Text>
      <View style={styles.events}>{["WEDDINGS", "COCKTAIL\nPARTIES", "BIRTHDAY\nCELEBRATIONS", "CORPORATE\nEVENTS"].map(label => <Text key={label} style={styles.event}>{label}</Text>)}</View>
      <Text style={styles.happiness}>— WE CATER HAPPINESS —</Text>
      {pageCount > 1 ? <Text style={styles.pageNumber}>1 / {pageCount}</Text> : null}
    </Page>
    {Array.from({ length: contentPageCount }, (_, page) => {
      const panel = page % 2 === 0 ? 1 : 2;
      return <Page key={page} size={[WIDTH, HEIGHT]} style={styles.page} wrap={false}>
      <PageArtwork background={contentBackground} panel={panel} />
      <Text style={[styles.note, { left: panel === 1 ? 166 : 153 }]}>{panel === 1 ? (artDeco ? "REFRESH · REJOICE\nREPEAT" : "SMALL BITES\nBIG CELEBRATIONS") : "GOOD FOOD\nGOOD COMPANY\nGREAT MEMORIES"}</Text>
      {sections.slice(page * 3, page * 3 + 3).map((section, row) => <CategorySection key={`${section.number}-${row}`} section={section} categoryPhotos={categoryPhotos} styles={styles} />)}
      <Text style={[styles.bottomCaption, { left: panel === 1 ? 107 : 95 }]}>{panel === 1 ? middleCaption : "Sweet Endings\nTo Beautiful Beginnings"}</Text>
      <Text style={styles.pageNumber}>{page + 2} / {pageCount}</Text>
    </Page>;
    })}
  </Document>;
}
