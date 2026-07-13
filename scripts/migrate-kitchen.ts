import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Running kitchen schema migration...");

  // 1. Create kitchen_dish_categories table
  await sql`
    CREATE TABLE IF NOT EXISTS "kitchen_dish_categories" (
      "id" serial PRIMARY KEY,
      "name" text NOT NULL UNIQUE,
      "selection_rule" text NOT NULL,
      "is_qty_field" boolean NOT NULL DEFAULT false,
      "sort_order" integer NOT NULL DEFAULT 0
    )
  `;
  console.log("✓ kitchen_dish_categories table created");

  // 2. Create kitchen_dishes table
  await sql`
    CREATE TABLE IF NOT EXISTS "kitchen_dishes" (
      "id" serial PRIMARY KEY,
      "category_id" integer NOT NULL REFERENCES "kitchen_dish_categories"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "sort_order" integer NOT NULL DEFAULT 0
    )
  `;
  console.log("✓ kitchen_dishes table created");

  // 3. Clear out any existing junction data (references old dishes table)
  await sql`TRUNCATE TABLE "kitchen_menu_dishes"`;
  console.log("✓ Truncated kitchen_menu_dishes");

  // 4. Drop the old kitchen_menu_dishes FK and column, add new one
  // First drop the old constraint and column
  try {
    await sql`ALTER TABLE "kitchen_menu_dishes" DROP CONSTRAINT IF EXISTS "kitchen_menu_dishes_dish_id_dishes_id_fk"`;
    console.log("✓ Dropped old FK constraint");
  } catch {
    console.log("  (old FK constraint not found, skipping)");
  }

  // Check if old dish_id column exists
  const colCheck = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'kitchen_menu_dishes' AND column_name = 'dish_id'
  `;

  if (colCheck.length > 0) {
    // Drop the old primary key first
    await sql`ALTER TABLE "kitchen_menu_dishes" DROP CONSTRAINT IF EXISTS "kitchen_menu_dishes_pkey"`;
    await sql`ALTER TABLE "kitchen_menu_dishes" DROP COLUMN "dish_id"`;
    console.log("✓ Dropped old dish_id column");
  }

  // Check if kitchen_dish_id column exists
  const newColCheck = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'kitchen_menu_dishes' AND column_name = 'kitchen_dish_id'
  `;

  if (newColCheck.length === 0) {
    await sql`
      ALTER TABLE "kitchen_menu_dishes"
      ADD COLUMN "kitchen_dish_id" integer NOT NULL REFERENCES "kitchen_dishes"("id") ON DELETE CASCADE
    `;
    console.log("✓ Added kitchen_dish_id column");
  }

  // Re-add primary key
  try {
    await sql`
      ALTER TABLE "kitchen_menu_dishes"
      ADD CONSTRAINT "kitchen_menu_dishes_pkey"
      PRIMARY KEY ("kitchen_menu_id", "kitchen_dish_id")
    `;
    console.log("✓ Added new primary key");
  } catch {
    console.log("  (primary key already exists)");
  }

  console.log("Migration complete!");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
