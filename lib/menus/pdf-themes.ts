export type MenuPdfTheme = {
  id: string;
  name: string;
  description: string;
  coverPreview: string;
  menuPreview: string | null;
};

/**
 * Use public URL strings (not static JPG imports).
 * Next's webpack image loader runs Sharp on imported images, and Sharp breaks
 * Termux/Android builds (`Cannot read properties of undefined (reading 'output')`).
 * Serving from `/menu-themes/...` works with `public/` present for next dev/start.
 */
export const menuPdfThemes: MenuPdfTheme[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Clean, simple menu layout",
    coverPreview: "/menu-themes/standard/preview-cover.jpg",
    menuPreview: null,
  },
  {
    id: "ivory-botanical",
    name: "Ivory Botanical",
    description: "Ivory, foliage and classic lettering",
    coverPreview: "/menu-themes/ivory-botanical/preview-cover.jpg",
    menuPreview: "/menu-themes/ivory-botanical/preview-menu.jpg",
  },
  {
    id: "burgundy-gold",
    name: "Burgundy Gold",
    description: "Rich burgundy with gold details",
    coverPreview: "/menu-themes/burgundy-gold/preview-cover.jpg",
    menuPreview: "/menu-themes/burgundy-gold/preview-menu.jpg",
  },
  {
    id: "emerald-gold",
    name: "Emerald Gold",
    description: "Deep green with botanical gold details",
    coverPreview: "/menu-themes/emerald-gold/preview-cover.jpg",
    menuPreview: "/menu-themes/emerald-gold/preview-menu.jpg",
  },
  {
    id: "art-deco-gold",
    name: "Art Deco Gold",
    description: "Black and gold with geometric borders",
    coverPreview: "/menu-themes/art-deco-gold/preview-cover.jpg",
    menuPreview: "/menu-themes/art-deco-gold/preview-menu.jpg",
  },
];
