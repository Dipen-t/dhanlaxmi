import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { rawMaterials } from "./schema";

loadEnvConfig(process.cwd());

const MATERIAL_NAMES = [
  "Paneer",
  "Mushroom",
  "Dahi",
  "Babycorn",
  "Juice",
  "R/Y Simla/Gobi",
  "Fruit",
  "Soya Chaap",
  "Mocktail",
  "Brooklyn",
  "Pani Puri",
  "Oyster",
  "Tikki Chat",
  "Salary/Basil",
  "Pasta",
  "Pav",
  "Dosa Coal",
  "Cake Parlour",
  "Delhi Chat",
  "Strawberry.S",
  "Pizza",
  "Mango.S",
  "G. Sandwich",
  "Paan",
  "Chinese",
  "Ice Cream",
  "Falooda",
  "Gulab Jamun",
] as const;

async function seed() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(databaseUrl);
  const db = drizzle({ client: sql });

  await db
    .insert(rawMaterials)
    .values(MATERIAL_NAMES.map((name) => ({ name })))
    .onConflictDoNothing();

  console.log(`Seeded ${MATERIAL_NAMES.length} raw materials`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
