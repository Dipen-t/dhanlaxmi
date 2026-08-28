import type { MenuDetail } from "@/app/menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

import { renderToBuffer } from "@react-pdf/renderer";

import { MenuPdfDocument } from "@/lib/menus/pdf-templates/standard-template";

export async function generateMenuPdfBuffer(
  menu: MenuDetail,
  logo: PdfLogoAssets,
  themeType: string = "standard",
  config?: { fontFamily: string; fontSize: string }
): Promise<Buffer> {
  registerPdfFonts();
  
  const buffer = await renderToBuffer(
    <MenuPdfDocument menu={menu} logo={logo} config={config} />,
  );

  return Buffer.from(buffer);
}
