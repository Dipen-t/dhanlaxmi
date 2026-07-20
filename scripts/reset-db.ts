import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";

loadEnvConfig(process.cwd());

async function reset() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(databaseUrl);
  console.log("Dropping and recreating public schema...");
  await sql`DROP SCHEMA public CASCADE;`;
  await sql`CREATE SCHEMA public;`;
  await sql`GRANT ALL ON SCHEMA public TO public;`;
  console.log("Schema reset successfully.");
}

reset().catch((error) => {
  console.error("Reset failed:", error);
  process.exit(1);
});
