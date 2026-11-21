import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateKitchenMenuPdfBuffer } from "../lib/menus/generate-kitchen-menu-pdf";
import { getPdfLogoAssets } from "../lib/menus/prepare-pdf-logo";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

async function main() {
  await mkdir("tmp/pdfs", { recursive: true });
  const logo = await getPdfLogoAssets();
  for (const count of [6, 30, 180]) {
    const categories = Array.from({ length: count / 6 }, (_, index) => ({
      id: index + 1,
      name: `Category ${index + 1} — ${index % 2 ? "Hi-tea dishes" : "Welcome starters and special selections"}`,
      selectionRule: "Any two",
      isQtyField: index % 3 === 0,
      dishes: Array.from({ length: 6 }, (_, dish) => ({
        id: index * 6 + dish + 1,
        name: `Dish-${String(index * 6 + dish + 1).padStart(3, "0")} Paneer tikka with special coriander sauce`,
        quantity: index % 3 === 0 ? "200 plates, packed separately" : undefined,
      })),
    }));
    const pdf = await generateKitchenMenuPdfBuffer({
      id: 0, name: "Kitchen layout verification", date: new Date("2026-11-30T00:00:00Z"),
      venue: "Long venue name — Main celebration hall, second floor, near the east entrance", numberOfPersons: 200,
      deliveryTime: "18:30", mealType: "Dinner", categories,
    }, logo);
    const file = path.resolve(`tmp/pdfs/kitchen-layout-${count}.pdf`);
    await writeFile(file, pdf);
    const loadingTask = getDocument({ data: new Uint8Array(pdf) });
    const document = await loadingTask.promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => "str" in item ? item.str : "").join(" "));
    }
    await loadingTask.destroy();
    const text = pages.join("\n");
    assert(pdf.length < 1024 * 1024);
    assert(pages.length <= (count === 6 ? 1 : count === 30 ? 2 : 10), "content should pack without wasted pages");
    for (let id = 1; id <= count; id++) assert(text.includes(`Dish-${String(id).padStart(3, "0")}`), `Missing dish ${id}`);
    assert(text.includes("30/11/2026"));
    assert(!text.includes("Category "), "Kitchen PDF should show items without category headings");
    assert(!text.includes("Any two"), "Selection rules do not belong in the kitchen item list");
    assert(text.includes("200 plates, packed separately"), "Item quantities must remain visible");
    for (const page of pages) {
      assert(page.includes("Dish-"), "No page should contain only headers/footers");
      assert(page.includes("KITCHEN MENU"));
    }
    console.log(`${count} dishes: ${pages.length} pages, all dishes present, ${(pdf.length / 1024).toFixed(0)} KiB`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
