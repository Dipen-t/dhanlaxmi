import type { MenuDetail } from "@/app/menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

import { renderToBuffer } from "@react-pdf/renderer";

import { MenuPdfDocument } from "@/lib/menus/pdf-templates/standard-template";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPdfCoverLogoAssets } from "./prepare-pdf-logo";
import { loadCategoryImages } from "./load-category-images";
import { IvoryBotanicalPdfDocument, registerBotanicalFonts } from "@/lib/menus/pdf-templates/ivory-botanical-template";

export async function generateMenuPdfBuffer(
  menu: MenuDetail,
  logo: PdfLogoAssets,
  themeType: string = "standard",
  config?: { fontFamily: string; fontSize: string }
): Promise<Buffer> {
  const categoryPhotos = await loadCategoryImages(menu.categories);
  if (themeType === "ivory-botanical" || themeType === "burgundy-gold" || themeType === "emerald-gold" || themeType === "art-deco-gold") {
    registerBotanicalFonts();
    const artwork = await readFile(path.join(process.cwd(), "public/menu-themes", themeType, "background-pdf.jpg"));
    const contentArtwork = await readFile(path.join(process.cwd(), "public/menu-themes", themeType, "background-content-pdf.jpg"));
    // Prepared assets keep Android/Termux PDF generation independent of native Sharp.
    const coverLogo = await getPdfCoverLogoAssets(themeType !== "ivory-botanical");
    const buffer = await renderToBuffer(
      <IvoryBotanicalPdfDocument menu={menu} logo={coverLogo} background={`data:image/jpeg;base64,${artwork.toString("base64")}`} theme={themeType} contentBackground={`data:image/jpeg;base64,${contentArtwork.toString("base64")}`} categoryPhotos={categoryPhotos} />,
    );
    return Buffer.from(buffer);
  }
  registerPdfFonts();
  
  const buffer = await renderToBuffer(
    <MenuPdfDocument menu={menu} logo={logo} config={config} categoryPhotos={categoryPhotos} />,
  );

  return Buffer.from(buffer);
}
