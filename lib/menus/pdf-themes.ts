import type { StaticImageData } from "next/image";

import artDecoCover from "@/public/menu-themes/art-deco-gold/preview-cover.jpg";
import artDecoMenu from "@/public/menu-themes/art-deco-gold/preview-menu.jpg";
import burgundyCover from "@/public/menu-themes/burgundy-gold/preview-cover.jpg";
import burgundyMenu from "@/public/menu-themes/burgundy-gold/preview-menu.jpg";
import emeraldCover from "@/public/menu-themes/emerald-gold/preview-cover.jpg";
import emeraldMenu from "@/public/menu-themes/emerald-gold/preview-menu.jpg";
import ivoryCover from "@/public/menu-themes/ivory-botanical/preview-cover.jpg";
import ivoryMenu from "@/public/menu-themes/ivory-botanical/preview-menu.jpg";
import standardCover from "@/public/menu-themes/standard/preview-cover.jpg";

export type MenuPdfTheme = {
  id: string;
  name: string;
  description: string;
  coverPreview: StaticImageData;
  menuPreview: StaticImageData | null;
};

/**
 * Preview thumbnails are imported (not `/public/...` URLs) so Webpack/Turbopack
 * emit them under `/_next/static/media/*`. That keeps Termux, standalone, and
 * LAN builds working even when the raw `public/menu-themes` folder isn't served.
 */
export const menuPdfThemes: MenuPdfTheme[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Clean, simple menu layout",
    coverPreview: standardCover,
    menuPreview: null,
  },
  {
    id: "ivory-botanical",
    name: "Ivory Botanical",
    description: "Ivory, foliage and classic lettering",
    coverPreview: ivoryCover,
    menuPreview: ivoryMenu,
  },
  {
    id: "burgundy-gold",
    name: "Burgundy Gold",
    description: "Rich burgundy with gold details",
    coverPreview: burgundyCover,
    menuPreview: burgundyMenu,
  },
  {
    id: "emerald-gold",
    name: "Emerald Gold",
    description: "Deep green with botanical gold details",
    coverPreview: emeraldCover,
    menuPreview: emeraldMenu,
  },
  {
    id: "art-deco-gold",
    name: "Art Deco Gold",
    description: "Black and gold with geometric borders",
    coverPreview: artDecoCover,
    menuPreview: artDecoMenu,
  },
];
