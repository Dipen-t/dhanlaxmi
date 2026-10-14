import { NextResponse } from "next/server";

import { getKitchenMenuById } from "@/app/kitchen-menus/actions";
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
    return NextResponse.json({ error: "Invalid kitchen menu." }, { status: 400 });
  }

  const menu = await getKitchenMenuById(menuId);

  if (!menu) {
    return NextResponse.json({ error: "Kitchen menu not found." }, { status: 404 });
  }

  if (menu.categories.length === 0) {
    return NextResponse.json(
      { error: "This kitchen menu has no dishes to export." },
      { status: 422 },
    );
  }

  try {
    const { getPdfLogoAssets } = await import("@/lib/menus/prepare-pdf-logo");
    const { generateKitchenMenuPdfBuffer } = await import("@/lib/menus/generate-kitchen-menu-pdf");
    const logo = await getPdfLogoAssets();
    const pdfBuffer = await generateKitchenMenuPdfBuffer(menu, logo);

    const filename = `${sanitizeFilename(menu.name)}-kitchen.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Kitchen Menu PDF generation failed:", error);
    return NextResponse.json(
      { error: "Could not generate PDF.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
