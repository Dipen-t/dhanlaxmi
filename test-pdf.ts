import { generateMenuPdfBuffer } from "./lib/menus/generate-menu-pdf";
import { getMenuById } from "./app/menus/actions";
import { getPdfLogoAssets } from "./lib/menus/prepare-pdf-logo";
import * as fs from "fs";

async function test() {
  try {
    const menu = await getMenuById(1);
    if (!menu) throw new Error("Menu 1 not found");
    const logo = await getPdfLogoAssets();
    console.log("Generating PDF...");
    const buffer = await generateMenuPdfBuffer(menu, logo, "standard", { fontFamily: "SourceSans", fontSize: "10pt" });
    console.log("Success, length:", buffer.length);
  } catch (error) {
    console.error("FATAL ERROR:", error);
  }
}

test();
