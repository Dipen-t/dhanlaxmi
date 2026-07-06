import type { MenuDetail } from "@/app/menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

export async function generateMenuPdfBuffer(
  menu: MenuDetail,
  logo: PdfLogoAssets,
): Promise<Buffer> {
  registerPdfFonts();
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const { MenuPdfDocument } = await import("@/lib/menus/menu-pdf-document");

  const buffer = await renderToBuffer(
    <MenuPdfDocument menu={menu} logo={logo} />,
  );

  return Buffer.from(buffer);
}
