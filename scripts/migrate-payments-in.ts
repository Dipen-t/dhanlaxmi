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
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount integer;`;

    await sql`
      CREATE TABLE IF NOT EXISTS order_payments (
        id serial PRIMARY KEY,
        order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        amount integer NOT NULL,
        date timestamp NOT NULL,
        is_waived boolean NOT NULL DEFAULT false,
        notes text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `;

    console.log("Migration successful");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

main();
