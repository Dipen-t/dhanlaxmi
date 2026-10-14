import { readFile } from "node:fs/promises";
import path from "node:path";

const HEADER_LOGO_WIDTH = 112;

export async function getPdfCoverLogoAssets(gold: boolean): Promise<PdfLogoAssets> {
  const file = await readFile(path.join(process.cwd(), "public/menu-themes", gold ? "logo-gold.png" : "logo-ink.png"));
  const { width, height } = readPngDimensions(file);
  return { src: `data:image/png;base64,${file.toString("base64")}`, headerWidth: width, headerHeight: height };
}

export type PdfLogoAssets = {
  src: string;
  headerWidth: number;
  headerHeight: number;
};

function readPngDimensions(buffer: Buffer): { width: number; height: number } {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(pngSignature)) {
    return { width: HEADER_LOGO_WIDTH, height: HEADER_LOGO_WIDTH };
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export async function getPdfLogoAssets(): Promise<PdfLogoAssets> {
  const logoPath = path.join(process.cwd(), "app", "logo.png");
  const file = await readFile(logoPath);
  const { width: nativeWidth, height: nativeHeight } = readPngDimensions(file);

  const aspectRatio = nativeWidth / nativeHeight;
  const headerWidth = HEADER_LOGO_WIDTH;
  const headerHeight = headerWidth / aspectRatio;

  return {
    src: `data:image/png;base64,${file.toString("base64")}`,
    headerWidth,
    headerHeight,
  };
}
