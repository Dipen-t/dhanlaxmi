"use server";

import { eq, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { kitchenDishCategories, kitchenDishes } from "@/db/schema";

function readId(formData: FormData, key = "id") {
  const id = Number(formData.get(key));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function refreshKitchenCatalog() {
  revalidatePath("/kitchen-menus/catalog");
  revalidatePath("/kitchen-menus");
  revalidatePath("/kitchen-menus/[id]", "page");
}

function mutationError(error: unknown) {
  let cause = error;
  for (let index = 0; index < 4 && cause && typeof cause === "object"; index += 1) {
    if ("code" in cause && cause.code === "23505") {
      return { error: "A category with this name already exists." };
    }
    cause = "cause" in cause ? cause.cause : null;
  }
  console.error("Kitchen catalog update failed", error);
  return { error: "Could not save your changes. Please try again." };
}

export async function saveKitchenCategory(formData: FormData) {
  const rawId = formData.get("id");
  const id = rawId ? readId(formData) : null;
  const name = String(formData.get("name") ?? "").trim();
  const selectionRule = String(formData.get("selectionRule") ?? "").trim();
  const isQtyField = formData.get("isQtyField") === "on";

  if (rawId && !id) return { error: "Invalid category." };
  if (!name || name.length > 100) {
    return { error: "Category name is required and must be 100 characters or less." };
  }
  if (selectionRule.length > 120) {
    return { error: "Category note must be 120 characters or less." };
  }

  try {
    const [duplicate] = await db
      .select({ id: kitchenDishCategories.id })
      .from(kitchenDishCategories)
      .where(sql`lower(${kitchenDishCategories.name}) = ${name.toLowerCase()}`)
      .limit(1);
    if (duplicate && duplicate.id !== id) {
      return { error: "A category with this name already exists." };
    }

    let savedId: number;
    if (id) {
      const [updated] = await db
        .update(kitchenDishCategories)
        .set({ name, selectionRule, isQtyField })
        .where(eq(kitchenDishCategories.id, id))
        .returning({ id: kitchenDishCategories.id });
      if (!updated) return { error: "Category no longer exists. Refresh and try again." };
      savedId = updated.id;
    } else {
      const [last] = await db.select({ order: max(kitchenDishCategories.sortOrder) }).from(kitchenDishCategories);
      const [created] = await db
        .insert(kitchenDishCategories)
        .values({ name, selectionRule, isQtyField, sortOrder: (last.order ?? -1) + 1 })
        .returning({ id: kitchenDishCategories.id });
      savedId = created.id;
    }

    refreshKitchenCatalog();
    return { success: true as const, id: savedId };
  } catch (error) {
    return mutationError(error);
  }
}

export async function deleteKitchenCategory(formData: FormData) {
  const id = readId(formData);
  if (!id) return { error: "Invalid category." };

  try {
    const [deleted] = await db
      .delete(kitchenDishCategories)
      .where(eq(kitchenDishCategories.id, id))
      .returning({ id: kitchenDishCategories.id });
    if (!deleted) return { error: "Category no longer exists." };
    refreshKitchenCatalog();
    return { success: true as const };
  } catch (error) {
    return mutationError(error);
  }
}

export async function saveKitchenDish(formData: FormData) {
  const rawId = formData.get("id");
  const id = rawId ? readId(formData) : null;
  const categoryId = readId(formData, "categoryId");
  const name = String(formData.get("name") ?? "").trim();

  if (!categoryId || (rawId && !id)) return { error: "Invalid dish or category." };
  if (!name || name.length > 120) {
    return { error: "Dish name is required and must be 120 characters or less." };
  }

  try {
    const [category] = await db
      .select({ id: kitchenDishCategories.id })
      .from(kitchenDishCategories)
      .where(eq(kitchenDishCategories.id, categoryId))
      .limit(1);
    if (!category) return { error: "Category no longer exists." };

    if (id) {
      const [existing] = await db
        .select({ categoryId: kitchenDishes.categoryId })
        .from(kitchenDishes)
        .where(eq(kitchenDishes.id, id))
        .limit(1);
      if (!existing || existing.categoryId !== categoryId) {
        return { error: "Dish no longer exists in this category." };
      }
      await db.update(kitchenDishes).set({ name }).where(eq(kitchenDishes.id, id));
    } else {
      const [last] = await db
        .select({ order: max(kitchenDishes.sortOrder) })
        .from(kitchenDishes)
        .where(eq(kitchenDishes.categoryId, categoryId));
      await db.insert(kitchenDishes).values({
        categoryId,
        name,
        sortOrder: (last.order ?? -1) + 1,
      });
    }

    refreshKitchenCatalog();
    return { success: true as const };
  } catch (error) {
    return mutationError(error);
  }
}

export async function deleteKitchenDish(formData: FormData) {
  const id = readId(formData);
  if (!id) return { error: "Invalid dish." };

  try {
    const [deleted] = await db
      .delete(kitchenDishes)
      .where(eq(kitchenDishes.id, id))
      .returning({ id: kitchenDishes.id });
    if (!deleted) return { error: "Dish no longer exists." };
    refreshKitchenCatalog();
    return { success: true as const };
  } catch (error) {
    return mutationError(error);
  }
}
