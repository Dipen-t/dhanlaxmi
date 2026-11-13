import { headers } from "next/headers";
import { menuPdfThemes } from "@/lib/menus/pdf-themes";

export function buildPublicPdfUrl(origin: string, kind: "menus" | "kitchen-menus", id: number, theme = "standard") {
  if (kind === "menus" && !menuPdfThemes.some((item) => item.id === theme)) {
    throw new Error("Select a valid PDF design.");
  }
  const base = new URL(origin);
  const host = base.hostname.toLowerCase();
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid menu.");
  if (!["https:", "http:"].includes(base.protocol) || base.username || base.password ||
    host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
    host === "[::1]" || host.startsWith("[fc") || host.startsWith("[fd") || host.startsWith("[fe80") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) {
    throw new Error("WhatsApp needs a public PDF URL. Set WHATSAPP_PUBLIC_APP_URL to the public app address; localhost and private Wi-Fi addresses cannot be used.");
  }
  const pdfUrl = new URL(`/api/${kind}/${id}/pdf`, base.origin);
  if (kind === "menus") pdfUrl.searchParams.set("theme", theme);
  return pdfUrl.toString();
}

export async function getWhatsAppPdfUrl(
  kind: "menus" | "kitchen-menus",
  id: number,
  theme: string,
  renderPdf: () => Promise<Buffer>,
) {
  if (kind === "menus" && !menuPdfThemes.some((item) => item.id === theme)) {
    throw new Error("Select a valid PDF design.");
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    const { uploadWhatsAppPdf } = await import("@/lib/whatsapp-pdf-blob");
    return uploadWhatsAppPdf(await renderPdf(), token);
  }
  const configured = process.env.WHATSAPP_PUBLIC_APP_URL?.trim();
  if (configured) return buildPublicPdfUrl(configured, kind, id, theme);
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")?.split(",")[0].trim() || requestHeaders.get("host");
  if (!host) throw new Error("Set WHATSAPP_PUBLIC_APP_URL to the public app address for WhatsApp PDF sharing.");
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim() || "https";
  return buildPublicPdfUrl(`${protocol}://${host}`, kind, id, theme);
}
