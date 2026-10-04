export const menuPdfThemes = [
  { id: "standard", name: "Standard", description: "Clean, simple menu layout", coverPreview: "/menu-themes/standard/preview-cover.jpg", menuPreview: null },
  ...[
    ["ivory-botanical", "Ivory Botanical", "Ivory, foliage and classic lettering"],
    ["burgundy-gold", "Burgundy Gold", "Rich burgundy with gold details"],
    ["emerald-gold", "Emerald Gold", "Deep green with botanical gold details"],
    ["art-deco-gold", "Art Deco Gold", "Black and gold with geometric borders"],
  ].map(([id, name, description]) => ({ id, name, description, coverPreview: `/menu-themes/${id}/preview-cover.jpg`, menuPreview: `/menu-themes/${id}/preview-menu.jpg` })),
];
