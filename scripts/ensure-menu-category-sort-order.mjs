/**
 * Adds menu_categories.sort_order if missing.
 * Run on Termux / any host before starting the app:
 *   node scripts/ensure-menu-category-sort-order.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

const url = process.env.DATABASE_URL ?? process.env.NEON_URL;
if (!url) {
  console.error("DATABASE_URL (or NEON_URL) is not set.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

try {
  await sql`
    ALTER TABLE menu_categories
    ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0
  `;

  await sql`
    UPDATE menu_categories AS mc
    SET sort_order = ranked.rn - 1
    FROM (
      SELECT
        mc2.menu_id,
        mc2.category_id,
        row_number() OVER (
          PARTITION BY mc2.menu_id
          ORDER BY dc.sort_order ASC, dc.id ASC
        ) AS rn
      FROM menu_categories mc2
      INNER JOIN dish_categories dc ON dc.id = mc2.category_id
    ) AS ranked
    WHERE mc.menu_id = ranked.menu_id
      AND mc.category_id = ranked.category_id
  `;

  const cols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'menu_categories'
    ORDER BY ordinal_position
  `;
  console.log(
    "menu_categories columns:",
    cols.map((c) => c.column_name).join(", "),
  );
  console.log("OK: sort_order is ready.");
} catch (error) {
  console.error("Failed:", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
