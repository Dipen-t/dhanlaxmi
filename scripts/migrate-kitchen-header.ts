import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Running kitchen menu header migration...");

  // 1. Add fields to kitchen_menus
  try {
    await sql`ALTER TABLE "kitchen_menus" ADD COLUMN "venue" text`;
    console.log("✓ Added venue column");
  } catch (e) {
    console.log("  (venue column already exists)");
  }

  try {
    await sql`ALTER TABLE "kitchen_menus" ADD COLUMN "date" timestamp`;
    console.log("✓ Added date column");
  } catch (e) {
    console.log("  (date column already exists)");
  }

  try {
    await sql`ALTER TABLE "kitchen_menus" ADD COLUMN "number_of_persons" integer`;
    console.log("✓ Added number_of_persons column");
  } catch (e) {
    console.log("  (number_of_persons column already exists)");
  }

  try {
    await sql`ALTER TABLE "kitchen_menus" ADD COLUMN "meal_type" text`;
    console.log("✓ Added meal_type column");
  } catch (e) {
    console.log("  (meal_type column already exists)");
  }

  // 2. Add field to kitchen_menu_dishes
  try {
    await sql`ALTER TABLE "kitchen_menu_dishes" ADD COLUMN "quantity" text`;
    console.log("✓ Added quantity column");
  } catch (e) {
    console.log("  (quantity column already exists)");
  }

  console.log("Migration complete!");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
