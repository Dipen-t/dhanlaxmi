"use server";

import { eq, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { dishCategories, dishes } from "@/db/schema";

function idFrom(form: FormData, key = "id") {
  const id = Number(form.get(key));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function fields(form: FormData) {
  return { name: String(form.get("name") ?? "").trim(), selectionRule: String(form.get("selectionRule") ?? "").trim() };
}

function refreshCatalog() {
  revalidatePath("/menus/catalog");
  revalidatePath("/menus");
  revalidatePath("/menus/[id]", "page");
}

function mutationError(error: unknown) {
  let cause = error;
  for (let i = 0; i < 4 && cause && typeof cause === "object"; i++) {
    if ("code" in cause && cause.code === "23505") return { error: "A category with this name already exists." };
    cause = "cause" in cause ? cause.cause : null;
  }
  console.error("Menu catalog update failed", error);
  return { error: "Could not save your changes. Please try again." };
}

export async function saveCategory(form: FormData) {
  const rawId = form.get("id");
  const id = rawId ? idFrom(form) : null;
  const { name, selectionRule } = fields(form);
  if (rawId && !id) return { error: "Invalid category." };
  if (!name || name.length > 100) return { error: "Category name is required and must be 100 characters or less." };
  if (selectionRule.length > 40) return { error: "Selection rule must be 40 characters or less." };
  try {
    const [duplicate] = await db.select({ id: dishCategories.id }).from(dishCategories)
      .where(sql`lower(${dishCategories.name}) = ${name.toLowerCase()}`).limit(1);
    if (duplicate && duplicate.id !== id) return { error: "A category with this name already exists." };
    let savedId: number;
    if (id) {
      const [updated] = await db.update(dishCategories).set({ name, selectionRule }).where(eq(dishCategories.id, id)).returning({ id: dishCategories.id });
      if (!updated) return { error: "Category no longer exists. Refresh and try again." };
      savedId = updated.id;
    } else {
      const [last] = await db.select({ order: max(dishCategories.sortOrder) }).from(dishCategories);
      const [created] = await db.insert(dishCategories).values({ name, selectionRule, sortOrder: (last.order ?? -1) + 1 }).returning({ id: dishCategories.id });
      savedId = created.id;
    }
    refreshCatalog();
    return { success: true as const, id: savedId };
  } catch (error) { return mutationError(error); }
}

export async function deleteCategory(form: FormData) {
  const id = idFrom(form);
  if (!id) return { error: "Invalid category." };
  try {
    // Foreign-key cascades atomically remove its dishes and links to menus.
    const [deleted] = await db.delete(dishCategories).where(eq(dishCategories.id, id)).returning({ id: dishCategories.id });
    if (!deleted) return { error: "Category no longer exists." };
    refreshCatalog();
    return { success: true as const };
  } catch (error) { return mutationError(error); }
}

export async function saveDish(form: FormData) {
  const rawId = form.get("id");
  const id = rawId ? idFrom(form) : null;
  const categoryId = idFrom(form, "categoryId");
  const { name } = fields(form);
  if (!categoryId || (rawId && !id)) return { error: "Invalid dish or category." };
  if (!name || name.length > 120) return { error: "Dish name is required and must be 120 characters or less." };
  try {
    const [category] = await db.select({ id: dishCategories.id }).from(dishCategories).where(eq(dishCategories.id, categoryId)).limit(1);
    if (!category) return { error: "Category no longer exists." };
    if (id) {
      const [existing] = await db.select({ categoryId: dishes.categoryId }).from(dishes).where(eq(dishes.id, id)).limit(1);
      if (!existing || existing.categoryId !== categoryId) return { error: "Dish no longer exists in this category." };
      await db.update(dishes).set({ name }).where(eq(dishes.id, id));
    } else {
      const [last] = await db.select({ order: max(dishes.sortOrder) }).from(dishes).where(eq(dishes.categoryId, categoryId));
      await db.insert(dishes).values({ categoryId, name, sortOrder: (last.order ?? -1) + 1 });
    }
    refreshCatalog();
    return { success: true as const };
  } catch (error) { return mutationError(error); }
}

export async function deleteDish(form: FormData) {
  const id = idFrom(form);
  if (!id) return { error: "Invalid dish." };
  try {
    const [deleted] = await db.delete(dishes).where(eq(dishes.id, id)).returning({ id: dishes.id });
    if (!deleted) return { error: "Dish no longer exists." };
    refreshCatalog();
    return { success: true as const };
  } catch (error) { return mutationError(error); }
}
