import { getMenus, getCatalogCategories } from "./app/menus/actions";

async function main() {
  try {
    console.log("Fetching menus...");
    const menus = await getMenus();
    console.log("Menus:", menus);
  } catch (err) {
    console.error("Error in getMenus:", err);
  }

  try {
    console.log("Fetching catalog categories...");
    const catalog = await getCatalogCategories();
    console.log("Catalog:", catalog);
  } catch (err) {
    console.error("Error in getCatalogCategories:", err);
  }
}

main().catch(console.error);
