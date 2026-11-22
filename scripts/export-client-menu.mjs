import { writeFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: [".env.local", ".env"] });

const sourceUrl = process.env.REMOTE_DATABASE_URL || process.env.DATABASE_URL;

if (!sourceUrl) {
  console.error("Error: No source database URL found in REMOTE_DATABASE_URL or DATABASE_URL.");
  process.exit(1);
}

async function exportClientMenu() {
  console.log("Connecting to database to export client menu...");
  const sql = postgres(sourceUrl, { ssl: "require", max: 1 });

  try {
    const categories = await sql`
      SELECT id, name, selection_rule AS "selectionRule", sort_order AS "sortOrder"
      FROM dish_categories
      ORDER BY sort_order ASC, id ASC
    `;

    const dishes = await sql`
      SELECT id, category_id AS "categoryId", name, sort_order AS "sortOrder"
      FROM dishes
      ORDER BY category_id ASC, sort_order ASC, id ASC
    `;

    const menus = await sql`
      SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM menus
      ORDER BY id ASC
    `;

    const menuCategories = await sql`
      SELECT menu_id AS "menuId", category_id AS "categoryId", sort_order AS "sortOrder", selected_dish_ids AS "selectedDishIds"
      FROM menu_categories
      ORDER BY menu_id ASC, sort_order ASC, category_id ASC
    `;

    const exportData = {
      exportedAt: new Date().toISOString(),
      source: "remote",
      summary: {
        categories: categories.length,
        dishes: dishes.length,
        menus: menus.length,
        menuCategories: menuCategories.length,
      },
      categories,
      dishes,
      menus,
      menuCategories,
    };

    const outPath = path.join(process.cwd(), "db", "client-menu-data.json");
    writeFileSync(outPath, JSON.stringify(exportData, null, 2), "utf8");

    console.log(`Successfully exported:`);
    console.log(`- ${categories.length} dish categories`);
    console.log(`- ${dishes.length} dishes`);
    console.log(`- ${menus.length} client menus`);
    console.log(`- ${menuCategories.length} menu-category mappings`);
    console.log(`Saved to ${outPath}`);
  } finally {
    await sql.end();
  }
}

exportClientMenu().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
