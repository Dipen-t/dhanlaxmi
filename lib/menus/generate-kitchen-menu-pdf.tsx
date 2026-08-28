import type { KitchenMenuDetail } from "@/app/kitchen-menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

import { renderToBuffer } from "@react-pdf/renderer";
import { KitchenMenuPdfDocument } from "@/lib/menus/kitchen-menu-pdf-document";

export async function generateKitchenMenuPdfBuffer(
  menu: KitchenMenuDetail,
  logo: PdfLogoAssets,
): Promise<Buffer> {
  registerPdfFonts();

  const buffer = await renderToBuffer(
    <KitchenMenuPdfDocument menu={menu} logo={logo} />,
  );

  return Buffer.from(buffer);
}
