# Category photos

PDF generation uses the prepared 450-pixel PNGs in `pdf/`, with real alpha transparency preserved. At the largest 148-point printed photo size this is about 219dpi. The 900-pixel master PNGs remain available. `scripts/optimize-menu-pdf-assets.cjs` prepares these smaller cutouts and compressed JPEGs for the opaque theme artwork, on a development machine only.

26 food photographs: 20 supplied photographs and 6 generated category images. The source filename, original stable catalog ID (where available), and asset key are recorded in `lib/menus/category-image-catalog.json`. The 900-pixel masters and compact 450-pixel PDF copies preserve alpha transparency. All five client-menu PDF themes share these assets. The PDF templates add no background or border around the photographs.

Recognized category names and aliases take priority over the original IDs, so repurposing Chinese Counter as Chinese Rice selects fried rice rather than the old noodles image. New category IDs may differ between installations; names resolve those sections without a migration. Unknown renamed original categories retain their original ID fallback.

16 assets come from the original transparent PNGs in Downloads, resized without flattening. The Veg Starter, Palak Starter, Non-Veg Starter and Rice originals have opaque checkerboards baked into the pixels; their backgrounds were extracted with the built-in imagegen tool. Source files in Downloads are unchanged.

Extraction prompt: Remove only the baked grey/white checkerboard; preserve all food, platters, bowls, garnish, arrangement, textures, colors and camera angle. Return a photographic cutout with real alpha transparency, including gaps between objects, with no replacement background, gradient, black fill or checkerboard.

## Generated additions

Generated with the built-in imagegen tool, with `transparent_background: true`. Prompt set: photorealistic isolated food cutouts, vivid premium Indian banquet photography, natural warm studio light, realistic textures, three-quarter front angle, complete objects in a compact horizontal 3:2 composition, real alpha outside the servingware and food, no table, backdrop, text, logos, or branding.

- `paan-mukhwas`: five sweet betel-leaf paan triangles with silver-leaf accents on a brass plate, with small brass bowls of fennel seeds and colorful mukhwas.
- `mineral-water`: three chilled clear unbranded water bottles with blue caps, two water-filled tumblers, and a small cluster of ice cubes.
- `chinese-rice`: vegetarian Indo-Chinese fried rice with separate glossy grains, diced carrots, beans, peppers, and spring onions in a dark ceramic bowl with a fine gold rim; no egg, meat, noodles, or biryani.
- `fruit-milk-ice-gola`: a brass platter of watermelon, pineapple, papaya, and grapes, a copper cup of saffron masala milk, and a glass dessert cup of colorful crushed-ice malai gola with rabri and pistachios.
- `tawa-bahar`: a black iron tawa of vegetarian keema and mushrooms with coriander and ginger, two toasted pav buns, and sauteed onions and peppers on a copper platter; no meat or egg.
- `assorted-extras`: grilled stuffed kulcha triangles and vegetable pizza slices on a brass platter, a small dark bowl of tomato penne pasta, and a citrus mint mocktail.

Reused photographs cover Welcome Drinks, Welcome Starters, Our Spl. Chaats, South Indian & Gourmet, Indian Counter, Paneer ki Sabji, Indian Main Course, Raita Ka Chaska, Roti ki Tokri, Ice Cream Parlour, Mitas Ki Bahar, Chinese Noodles, and Chinese Main Course.
