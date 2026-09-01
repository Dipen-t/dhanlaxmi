import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { menuCatalog } from "./menu-catalog";
import * as schema from "./schema";
import { dishCategories, dishes } from "./schema";

loadEnvConfig(process.cwd());

async function seedMenuCatalog() {
  const databaseUrl = process.env.DATABASE_URL ?? process.env.NEON_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const queryClient = postgres(databaseUrl, { prepare: false });
  const db = drizzle(queryClient, { schema });

  const existing = await db.query.dishCategories.findFirst();
  if (existing) {
    console.log("Menu catalog already seeded — skipping.");
    return;
  }

  for (const [index, category] of menuCatalog.entries()) {
    const [insertedCategory] = await db
      .insert(dishCategories)
      .values({
        name: category.name,
        selectionRule: category.selectionRule,
        sortOrder: index,
      })
      .returning({ id: dishCategories.id });

    await db.insert(dishes).values(
      category.dishes.map((name, dishIndex) => ({
        categoryId: insertedCategory.id,
        name,
        sortOrder: dishIndex,
      })),
    );
  }

  const totalDishes = menuCatalog.reduce((sum, c) => sum + c.dishes.length, 0);
  console.log(`Seeded ${menuCatalog.length} categories and ${totalDishes} dishes.`);
}

seedMenuCatalog().catch((error) => {
  console.error("Menu catalog seed failed:", error);
  process.exit(1);
});
