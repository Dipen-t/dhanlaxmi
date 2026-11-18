import nextEnv from "@next/env";
import postgres from "postgres";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL ?? process.env.NEON_URL;
if (!url) throw new Error("DATABASE_URL (or NEON_URL) is not set.");

const sql = postgres(url, { prepare: false, max: 1 });
try {
  await sql.begin(async (transaction) => {
    await transaction`ALTER TABLE order_raw_materials ADD COLUMN IF NOT EXISTS timing text`;
    await transaction`ALTER TABLE orders ADD COLUMN IF NOT EXISTS material_order integer[]`;
    await transaction`ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 2147483647`;
  });
  console.log("Kitchen item timing and saved arrangement are ready.");
} catch (error) {
  console.error("Could not prepare kitchen item settings:", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
