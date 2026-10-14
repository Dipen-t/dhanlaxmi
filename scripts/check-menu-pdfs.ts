import assert from "node:assert/strict";
import Module from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { menuCatalog } from "../db/menu-catalog";

async function main() {
  // Exercise the same generation path with Android's native-module limitation
  // and no internet. All required assets must be local.
  const loader = Module as unknown as { _load: (name: string, ...args: unknown[]) => unknown };
  const originalLoad = loader._load;
  const originalFetch = globalThis.fetch;
  loader._load = function (name, ...args) {
    if (name === "sharp" || name.startsWith("@img/sharp")) throw new Error("Native Sharp unavailable in this test");
    return originalLoad.call(this, name, ...args);
  };
  globalThis.fetch = async () => { throw new Error("Network disabled in PDF portability test"); };
  try {
    const { generateMenuPdfBuffer } = await import("../lib/menus/generate-menu-pdf");
    const { generateKitchenMenuPdfBuffer } = await import("../lib/menus/generate-kitchen-menu-pdf");
    const { getPdfLogoAssets } = await import("../lib/menus/prepare-pdf-logo");
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { ProfitabilityPDF } = await import("../components/reports/pdf-reports");
    const { calculateCashPosition } = await import("../lib/reports/cash-position");
    const logo = await getPdfLogoAssets();
    const categories = menuCatalog.map((category, i) => ({ ...category, id: i + 1, dishes: category.dishes.map((name, id) => ({ id, name })) }));
    const menu = { id: 0, name: "Wedding Celebration Menu", categories };
    await mkdir("tmp/pdfs", { recursive: true });
    for (const theme of ["standard", "ivory-botanical", "burgundy-gold", "emerald-gold", "art-deco-gold"]) {
      const result = await generateMenuPdfBuffer(menu, logo, theme);
      assert.equal(result.subarray(0, 5).toString(), "%PDF-");
      await writeFile(`tmp/pdfs/${theme}-stress.pdf`, result);
      console.log(`${theme}: PDF generated without fetch or Sharp`);
    }
    for (const fontFamily of ["Inter", "Playball", "Cormorant"]) {
      const result = await generateMenuPdfBuffer({ ...menu, categories: categories.slice(0, 2) }, logo, "standard", { fontFamily, fontSize: "14pt" });
      assert.equal(result.subarray(0, 5).toString(), "%PDF-");
      console.log(`${fontFamily}: offline typography verified`);
    }
    const kitchen = await generateKitchenMenuPdfBuffer({ id: 0, name: "Kitchen Test", categories: [] }, logo);
    assert.equal(kitchen.subarray(0, 5).toString(), "%PDF-");
    console.log("Kitchen PDF: generated offline");
    const cash = calculateCashPosition([{ amount: 50_000, isWaived: false, expenses: [{ amount: 5_000 }] }], [{ amount: 5_000 }]);
    const report = await renderToBuffer(ProfitabilityPDF({ reports: [{
      ...cash, id: 0, orderId: "TEST-100K", customerName: "Calculation test", customerPhone: null,
      date: "14/10/2026", venue: "Test", mealType: "lunch", revenue: 100_000, clientBalance: 50_000,
    }] }));
    await writeFile("tmp/pdfs/profitability-40k.pdf", report);
    console.log("Report PDF: both expense columns and 40k cash profit exported");
  } finally {
    loader._load = originalLoad;
    globalThis.fetch = originalFetch;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
