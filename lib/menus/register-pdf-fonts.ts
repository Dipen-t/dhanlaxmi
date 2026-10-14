import path from "node:path";
import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;
const families = [
  { family: "Playball", file: "playball", weights: [400] },
  { family: "Cormorant", file: "cormorant-garamond", weights: [400, 600], italic: true },
  { family: "SourceSans", file: "source-sans-3", weights: [400, 600] },
  { family: "Inter", file: "inter", weights: [400, 600] },
  { family: "Playfair Display", file: "playfair-display", weights: [400, 600] },
  { family: "EB Garamond", file: "eb-garamond", weights: [400, 500], italic: true },
  { family: "Poppins", file: "poppins", weights: [400, 500, 600, 700] },
];

export function registerPdfFonts() {
  if (fontsRegistered) return;
  for (const entry of families) {
    const source = (weight: number, style: string) => path.join(process.cwd(), "public/fonts/menu", `${entry.file}-${weight}-${style}.ttf`);
    Font.register({
      family: entry.family,
      fonts: [
        ...entry.weights.map(fontWeight => ({ src: source(fontWeight, "normal"), fontWeight })),
        ...(entry.italic ? [{ src: source(400, "italic"), fontWeight: 400, fontStyle: "italic" as const }] : []),
      ],
    });
  }
  fontsRegistered = true;
}
