import type { KitchenMenuDetail } from "@/app/kitchen-menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

export async function generateKitchenMenuPdfBuffer(
  menu: KitchenMenuDetail,
  logo: PdfLogoAssets,
): Promise<Buffer> {
  registerPdfFonts();
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { KitchenMenuPdfDocument } = await import("@/lib/menus/kitchen-menu-pdf-document");

  const buffer = await renderToBuffer(
    <KitchenMenuPdfDocument menu={menu} logo={logo} />,
  );

  return Buffer.from(buffer);
}
