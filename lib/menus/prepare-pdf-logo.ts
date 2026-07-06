import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const HEADER_LOGO_WIDTH = 112;

export type PdfLogoAssets = {
  src: string;
  headerWidth: number;
  headerHeight: number;
};

export async function getPdfLogoAssets(): Promise<PdfLogoAssets> {
  const logoPath = path.join(process.cwd(), "app", "logo.png");
  const file = await readFile(logoPath);
  const metadata = await sharp(file).metadata();

  const nativeWidth = metadata.width ?? HEADER_LOGO_WIDTH;
  const nativeHeight = metadata.height ?? HEADER_LOGO_WIDTH;
  const aspectRatio = nativeWidth / nativeHeight;

  const headerWidth = HEADER_LOGO_WIDTH;
  const headerHeight = headerWidth / aspectRatio;

  const rasterWidth = Math.min(nativeWidth, HEADER_LOGO_WIDTH * 4);

  const optimized = await sharp(file)
    .resize({ width: rasterWidth, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return {
    src: `data:image/png;base64,${optimized.toString("base64")}`,
    headerWidth,
    headerHeight,
  };
}
