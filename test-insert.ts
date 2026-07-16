import { config } from "dotenv";
config({ path: ".env" });
import { db } from "./db";
import { sql } from "drizzle-orm";

async function test() {
  try {
    console.log("Running DDL...");
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;`);
    console.log("DDL executed.");
  } catch (err: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = err as any;
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
    console.log("Error code:", e?.code);
    console.log("Full error:", e);
  }
}

test().catch(console.error);
