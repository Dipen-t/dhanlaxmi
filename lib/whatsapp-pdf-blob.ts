import { put } from "@vercel/blob";

export async function uploadWhatsAppPdf(pdf: Buffer, token: string) {
  try {
    const blob = await put("whatsapp-pdfs/menu.pdf", pdf, {
      access: "public",
      token,
      contentType: "application/pdf",
      addRandomSuffix: true,
      cacheControlMaxAge: 60,
      ttlDays: 1,
      multipart: pdf.length > 5 * 1024 * 1024,
      abortSignal: AbortSignal.timeout(60_000),
    });
    return blob.url;
  } catch (cause) {
    throw new Error("Could not upload the PDF. Check the connection and the read-write token for the public Blob store.", { cause });
  }
}
