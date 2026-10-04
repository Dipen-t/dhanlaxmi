import type { MenuDetail } from "@/app/menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

import { renderToBuffer } from "@react-pdf/renderer";

import { MenuPdfDocument } from "@/lib/menus/pdf-templates/standard-template";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { IvoryBotanicalPdfDocument, registerBotanicalFonts } from "@/lib/menus/pdf-templates/ivory-botanical-template";

export async function generateMenuPdfBuffer(
  menu: MenuDetail,
  logo: PdfLogoAssets,
  themeType: string = "standard",
  config?: { fontFamily: string; fontSize: string }
): Promise<Buffer> {
  if (themeType === "ivory-botanical" || themeType === "burgundy-gold" || themeType === "emerald-gold" || themeType === "art-deco-gold") {
    registerBotanicalFonts();
    const backgroundFile = themeType === "art-deco-gold" ? "background-v2.png" : "background-v1.png";
    const artwork = await readFile(path.join(process.cwd(), "public/menu-themes", themeType, backgroundFile));
    // Remove the logo's transparent outer padding so the cover aligns with the reference.
    const logoBuffer = Buffer.from(logo.src.split(",")[1], "base64");
    const logoImage = sharp(logoBuffer).trim();
    // Retain the logo's lettering and alpha; apply the dark theme's gold ink.
    if (themeType !== "ivory-botanical") logoImage.linear([0, 0, 0], [244, 215, 143]);
    const croppedLogo = await logoImage.png().toBuffer({ resolveWithObject: true });
    const coverLogo = { src: `data:image/png;base64,${croppedLogo.data.toString("base64")}`, headerWidth: croppedLogo.info.width, headerHeight: croppedLogo.info.height };
    const buffer = await renderToBuffer(
      <IvoryBotanicalPdfDocument menu={menu} logo={coverLogo} background={`data:image/png;base64,${artwork.toString("base64")}`} theme={themeType} />,
    );
    return Buffer.from(buffer);
  }
  registerPdfFonts();
  
  const buffer = await renderToBuffer(
    <MenuPdfDocument menu={menu} logo={logo} config={config} />,
  );

  return Buffer.from(buffer);
}
