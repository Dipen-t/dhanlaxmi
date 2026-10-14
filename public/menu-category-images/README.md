# Category photos

PDF generation uses the prepared 450-pixel PNGs in `pdf/`, with real alpha transparency preserved. At the largest 148-point printed photo size this is about 219dpi. The 900-pixel master PNGs remain available. `scripts/optimize-menu-pdf-assets.cjs` prepares these smaller cutouts and compressed JPEGs for the opaque theme artwork, on a development machine only.

20 supplied food photographs, mapped by their contents to the existing catalog. The source filename, stable catalog ID and asset key are recorded in `lib/menus/category-image-catalog.json`. Print assets are 900-pixel PNGs with their alpha channels preserved, shared by all five PDF themes. The PDF templates add no background or border around the photographs.

16 assets come from the original transparent PNGs in Downloads, resized without flattening. The Veg Starter, Palak Starter, Non-Veg Starter and Rice originals have opaque checkerboards baked into the pixels; their backgrounds were extracted with the built-in imagegen tool. Source files in Downloads are unchanged.

Extraction prompt: Remove only the baked grey/white checkerboard; preserve all food, platters, bowls, garnish, arrangement, textures, colors and camera angle. Return a photographic cutout with real alpha transparency, including gaps between objects, with no replacement background, gradient, black fill or checkerboard.
