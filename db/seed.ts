import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
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

  const queryClient = postgres(databaseUrl, { prepare: false });
  const db = drizzle(queryClient, { schema });

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
