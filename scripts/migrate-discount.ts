import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(dbUrl);

async function main() {
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount text;`;
    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

main();
