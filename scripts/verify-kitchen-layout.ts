import { mkdir, writeFile } from "node:fs/promises";
import { generateKitchenMenuPdfBuffer } from "../lib/menus/generate-kitchen-menu-pdf";
import { getPdfLogoAssets } from "../lib/menus/prepare-pdf-logo";

async function main() {
  await mkdir("tmp/pdfs", { recursive: true });
  const logo = await getPdfLogoAssets();
  for (const count of [30, 140]) {
    const categories = [{ id: 1, name: "Kitchen supplies", selectionRule: "", isQtyField: true,
      dishes: Array.from({ length: count }, (_, i) => ({ id: i + 1, name: ["Paneer", "Mushroom", "Babycorn", "Juice", "Pasta", "Chinese", "Ice cream"][i % 7], quantity: `${i + 1} kg` })) }];
    const buffer = await generateKitchenMenuPdfBuffer({ id: 1, name: "Kitchen preparation", venue: "Grand Celebration Hall", date: new Date("2026-11-20T00:00:00Z"), numberOfPersons: 1000, mealType: "Dinner", deliveryTime: "19:30", categories }, logo);
    await writeFile(`tmp/pdfs/kitchen-${count}.pdf`, buffer);
  }
}
void main();
