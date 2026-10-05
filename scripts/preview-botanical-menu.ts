import { mkdir, writeFile } from "node:fs/promises";
import { generateMenuPdfBuffer } from "../lib/menus/generate-menu-pdf";
import { getPdfLogoAssets } from "../lib/menus/prepare-pdf-logo";
import { menuCatalog } from "../db/menu-catalog";

async function main() {
  const theme = process.argv.includes("--standard") ? "standard" : process.argv.includes("--art-deco") ? "art-deco-gold" : process.argv.includes("--emerald") ? "emerald-gold" : process.argv.includes("--burgundy") ? "burgundy-gold" : "ivory-botanical";
  const selected = [
    { name: "Welcome Drinks", selectionRule: "", dishes: ["3 Types of Mocktails", "Soda", "Mineral Water"] },
    { ...menuCatalog[0], name: "Soup" },
    { ...menuCatalog[1], name: "Paneer & Mushroom Starter", selectionRule: "Any two" },
    { ...menuCatalog[2], name: "Veg Starter", selectionRule: "Any three" },
    { ...menuCatalog[3], name: "Palak Special" },
    { name: "Sweet Counter", selectionRule: "Any one", dishes: ["Jalebi Rabdi", "Gajar Halwa (Seasonal)", "Mung Dal Halwa", "Sham Savera"] },
  ];
  const categories = selected.map((category, index) => ({ ...category, id: index + 1, dishes: category.dishes.map((name, id) => ({ id, name })) }));
  const logo = await getPdfLogoAssets();
  await mkdir("output/pdf", { recursive: true });
  const sample = await generateMenuPdfBuffer({ id: 0, name: "Veg Cocktail", categories }, logo, theme);
  await writeFile(`output/pdf/${theme}-sample.pdf`, sample);
  if (process.argv.includes("--stress")) {
    const stressCategories = menuCatalog.map((category, id) => ({ ...category, id, dishes: category.dishes.map((name, dishId) => ({ id: dishId, name })) }));
    const stress = await generateMenuPdfBuffer({ id: 0, name: "Wedding Celebration Menu", categories: stressCategories }, logo, theme);
    await mkdir("tmp/pdfs", { recursive: true });
    await writeFile(`tmp/pdfs/${theme}-stress.pdf`, stress);
    await writeFile("tmp/pdfs/expected-dishes.json", JSON.stringify(stressCategories.flatMap(category => category.dishes.map(dish => dish.name))));
  }
  console.log(`${theme} sample PDF generated.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
