import type { MenuDetail } from "@/app/menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

export async function generateMenuPdfBuffer(
  menu: MenuDetail,
  logo: PdfLogoAssets,
  themeType: string = "standard",
  config?: { fontFamily: string; fontSize: string }
): Promise<Buffer> {
  registerPdfFonts();
  const { renderToBuffer } = await import("@react-pdf/renderer");
  
  let DocumentComponent: any;
  
  switch (themeType) {
    case "wedding":
      DocumentComponent = (await import("@/lib/menus/pdf-templates/wedding-template")).default;
      break;
    case "party":
      DocumentComponent = (await import("@/lib/menus/pdf-templates/party-template")).default;
      break;
    case "corporate":
      DocumentComponent = (await import("@/lib/menus/pdf-templates/corporate-template")).default;
      break;
    case "standard":
    default:
      DocumentComponent = (await import("@/lib/menus/pdf-templates/standard-template")).MenuPdfDocument;
      break;
  }

  const buffer = await renderToBuffer(
    <DocumentComponent menu={menu} logo={logo} config={config} />,
  );

  return Buffer.from(buffer);
}
