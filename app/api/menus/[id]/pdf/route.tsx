import { NextResponse } from "next/server";

import { getMenuById } from "@/app/menus/actions";
import { generateMenuPdfBuffer } from "@/lib/menus/generate-menu-pdf";
import { getPdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { sanitizeFilename } from "@/lib/menus/sanitize-filename";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const menuId = Number(id);

  if (!menuId || Number.isNaN(menuId)) {
    return NextResponse.json({ error: "Invalid menu." }, { status: 400 });
  }

  const menu = await getMenuById(menuId);

  if (!menu) {
    return NextResponse.json({ error: "Menu not found." }, { status: 404 });
  }

  if (menu.categories.length === 0) {
    return NextResponse.json(
      { error: "This menu has no categories to export." },
      { status: 422 },
    );
  }

  try {
    const url = new URL(_request.url);
    const templateId = url.searchParams.get("templateId");

    let pdfBuffer: Buffer;

    if (templateId) {
      const { getPdfTemplate } = await import("@/app/settings/pdf-templates/actions");
      const templateRecord = await getPdfTemplate(Number(templateId));

      if (!templateRecord) {
        return NextResponse.json({ error: "Template not found." }, { status: 404 });
      }

      const { generate } = await import("@pdfme/generator");
      const { text, image, barcodes } = await import("@pdfme/schemas");
      
      const template = JSON.parse(templateRecord.templateJson);
      
      // Map menu data to inputs (flattening it for basic text fields)
      const inputs = [{
        menuName: menu.name,
        date: new Date().toLocaleDateString(),
        // Just providing standard fields. For arrays, pdfme expects specific table formats
      }];

      const uint8Array = await generate({ 
        template, 
        inputs,
        plugins: { text, image, qrcode: barcodes.qrcode, barcode: barcodes.code128 }
      });
      pdfBuffer = Buffer.from(uint8Array);
    } else {
      const logo = await getPdfLogoAssets();
      pdfBuffer = await generateMenuPdfBuffer(menu, logo);
    }

    const filename = `${sanitizeFilename(menu.name)}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Menu PDF generation failed:", error);
    return NextResponse.json(
      { error: "Could not generate PDF. Try again." },
      { status: 500 },
    );
  }
}
