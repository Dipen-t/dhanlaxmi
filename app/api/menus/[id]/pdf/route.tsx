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
    const theme = url.searchParams.get("theme") || "standard";
    const fontFamily = url.searchParams.get("fontFamily") || "SourceSans";
    const fontSize = url.searchParams.get("fontSize") || "10pt";
    const isInline = url.searchParams.get("inline") === "true";
    const isPreview = url.searchParams.get("preview") === "true";

    let pdfBuffer: Buffer;

    const config = {
      fontFamily: fontFamily,
      fontSize: fontSize,
    };

    const logo = await getPdfLogoAssets();
    
    const { generateMenuPdfBuffer } = await import("@/lib/menus/generate-menu-pdf");
    pdfBuffer = await generateMenuPdfBuffer(menu, logo, theme, config);

    const filename = `${sanitizeFilename(menu.name)}.pdf`;
    const disposition = isInline ? "inline" : "attachment";
    
    // Use octet-stream for previews to prevent download managers (like IDM) from intercepting the fetch request
    const contentType = isPreview ? "application/octet-stream" : "application/pdf";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `${disposition}; filename="${filename}"`,
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
