import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import postgres from "postgres";

// Load environment variables (.env.local takes priority, then .env)
dotenv.config({ path: [".env.local", ".env"] });

// Parse command line arguments (--from=<url>, --to=<url>, --live)
const args = process.argv.slice(2);
function getArg(prefix) {
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}
const isLive = args.includes("--live");
const customFrom = getArg("--from=");
const customTo = getArg("--to=");

// Target database (local database to migrate data INTO)
const targetUrl = customTo || process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;

// Remote database (to fetch live data from, if requested)
const sourceUrl = customFrom || process.env.REMOTE_DATABASE_URL || (isLive ? process.env.DATABASE_URL : null);

if (!targetUrl) {
  console.error("Error: Target DATABASE_URL is not set.");
  console.error("Provide it via .env.local (DATABASE_URL=...), LOCAL_DATABASE_URL, or --to='postgresql://...'");
  process.exit(1);
}

function getDbClient(url) {
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1") || url.includes("@host.docker.internal");
  return postgres(url, {
    ssl: isLocal ? false : "require",
    max: 1,
    connect_timeout: 15,
  });
}

async function loadData() {
  // If explicitly requested to fetch live from remote database:
  if (sourceUrl && (isLive || customFrom)) {
    console.log("Connecting to remote database to fetch live client menu data...");
    const srcSql = getDbClient(sourceUrl);
    try {
      const categories = await srcSql`
        SELECT id, name, selection_rule AS "selectionRule", sort_order AS "sortOrder"
        FROM dish_categories
        ORDER BY sort_order ASC, id ASC
      `;
      const dishes = await srcSql`
        SELECT id, category_id AS "categoryId", name, sort_order AS "sortOrder"
        FROM dishes
        ORDER BY category_id ASC, sort_order ASC, id ASC
      `;
      const menus = await srcSql`
        SELECT id, name, created_at AS "createdAt", updated_at AS "updatedAt"
        FROM menus
        ORDER BY id ASC
      `;
      const menuCategories = await srcSql`
        SELECT menu_id AS "menuId", category_id AS "categoryId", sort_order AS "sortOrder", selected_dish_ids AS "selectedDishIds"
        FROM menu_categories
        ORDER BY menu_id ASC, sort_order ASC, category_id ASC
      `;
      return { categories, dishes, menus, menuCategories };
    } finally {
      await srcSql.end();
    }
  }

  // Default: load from the committed JSON snapshot in db/client-menu-data.json
  const jsonPath = path.join(process.cwd(), "db", "client-menu-data.json");
  if (!existsSync(jsonPath)) {
    console.error(`Error: Snapshot file not found at ${jsonPath}`);
    console.error("Run 'npm run db:export-client-menu' first to generate it.");
    process.exit(1);
  }

  console.log(`Loading client menu data from ${jsonPath}...`);
  const content = readFileSync(jsonPath, "utf8");
  return JSON.parse(content);
}

async function migrateClientMenu() {
  const data = await loadData();
  const { categories, dishes, menus, menuCategories } = data;

  console.log(`Found ${categories.length} categories, ${dishes.length} dishes, ${menus.length} menus, and ${menuCategories.length} category links to migrate.`);
  console.log("Connecting to target database...");

  const targetSql = getDbClient(targetUrl);

  try {
    await targetSql.begin(async (tx) => {
      console.log("Cleaning existing client menu records in target database...");
      await tx`DELETE FROM menu_categories`;
      await tx`DELETE FROM menus`;
      await tx`DELETE FROM dishes`;
      await tx`DELETE FROM dish_categories`;

      console.log(`Inserting ${categories.length} dish categories...`);
      for (const cat of categories) {
        await tx`
          INSERT INTO dish_categories (id, name, selection_rule, sort_order)
          VALUES (${cat.id}, ${cat.name}, ${cat.selectionRule}, ${cat.sortOrder ?? 0})
        `;
      }

      console.log(`Inserting ${dishes.length} dishes...`);
      // Insert in chunks of 50 to optimize query size
      for (let i = 0; i < dishes.length; i += 50) {
        const chunk = dishes.slice(i, i + 50);
        for (const dish of chunk) {
          await tx`
            INSERT INTO dishes (id, category_id, name, sort_order)
            VALUES (${dish.id}, ${dish.categoryId}, ${dish.name}, ${dish.sortOrder ?? 0})
          `;
        }
      }

      console.log(`Inserting ${menus.length} client menus...`);
      for (const menu of menus) {
        const createdAt = menu.createdAt ? new Date(menu.createdAt) : new Date();
        const updatedAt = menu.updatedAt ? new Date(menu.updatedAt) : new Date();
        await tx`
          INSERT INTO menus (id, name, created_at, updated_at)
          VALUES (${menu.id}, ${menu.name}, ${createdAt}, ${updatedAt})
        `;
      }

      console.log(`Inserting ${menuCategories.length} menu-category mappings...`);
      for (const mc of menuCategories) {
        await tx`
          INSERT INTO menu_categories (menu_id, category_id, sort_order, selected_dish_ids)
          VALUES (${mc.menuId}, ${mc.categoryId}, ${mc.sortOrder ?? 0}, ${mc.selectedDishIds || null})
        `;
      }

      console.log("Updating PostgreSQL sequences to match highest IDs...");
      await tx`SELECT setval('dish_categories_id_seq', COALESCE((SELECT MAX(id) FROM dish_categories), 1))`;
      await tx`SELECT setval('dishes_id_seq', COALESCE((SELECT MAX(id) FROM dishes), 1))`;
      await tx`SELECT setval('menus_id_seq', COALESCE((SELECT MAX(id) FROM menus), 1))`;
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✓ Client menu migration completed successfully!");
    console.log(`  • Categories : ${categories.length}`);
    console.log(`  • Dishes     : ${dishes.length}`);
    console.log(`  • Menus      : ${menus.length}`);
    console.log(`  • Mappings   : ${menuCategories.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } finally {
    await targetSql.end();
  }
}

migrateClientMenu().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
