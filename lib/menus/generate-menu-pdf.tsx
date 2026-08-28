import type { MenuDetail } from "@/app/menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

import { renderToBuffer } from "@react-pdf/renderer";

export async function generateMenuPdfBuffer(
  menu: MenuDetail,
  logo: PdfLogoAssets,
  themeType: string = "standard",
  config?: { fontFamily: string; fontSize: string }
): Promise<Buffer> {
  registerPdfFonts();
  
  const DocumentComponent = (await import("@/lib/menus/pdf-templates/standard-template")).MenuPdfDocument;
  const buffer = await renderToBuffer(
    <DocumentComponent menu={menu} logo={logo} config={config} />,
  );

  return Buffer.from(buffer);
}
