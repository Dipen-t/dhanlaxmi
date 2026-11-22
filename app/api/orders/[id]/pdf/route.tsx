import { NextResponse } from "next/server";
import { getOrder } from "@/app/orders/actions";
import { generateOrderMenuPdfBuffer } from "@/lib/orders/order-pdf";
import { sanitizeFilename } from "@/lib/menus/sanitize-filename";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const orderId = Number(id);

  if (!orderId || Number.isNaN(orderId)) {
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  }

  const order = await getOrder(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.menuDishes.length === 0 && !order.hiTeaNotes?.trim()) {
    return NextResponse.json(
      { error: "This order has no selected menu to export." },
      { status: 422 },
    );
  }

  try {
    const url = new URL(_request.url);
    const isInline = url.searchParams.get("inline") === "true";
    const isPreview = url.searchParams.get("preview") === "true";

    const pdfBuffer = await generateOrderMenuPdfBuffer(order);

    const filename = `${sanitizeFilename(order.customerName || order.orderId)}-menu.pdf`;
    const disposition = isInline ? "inline" : "attachment";
    const contentType = isPreview ? "application/octet-stream" : "application/pdf";

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Order menu PDF generation error:", error);
    return NextResponse.json(
      { error: "Could not generate order menu PDF." },
      { status: 500 },
    );
  }
}
