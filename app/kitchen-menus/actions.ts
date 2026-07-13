"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  dishCategories,
  dishes,
  kitchenMenuDishes,
  kitchenMenus,
} from "@/db/schema";
import type { CategoryWithDishes, DishItem } from "@/app/menus/actions";

export type KitchenMenuSummary = {
  id: number;
  name: string;
  dishCount: number;
  dishIds: number[];
};

export type KitchenMenuDetail = {
  id: number;
  name: string;
  categories: CategoryWithDishes[];
};

export async function getKitchenMenus(): Promise<KitchenMenuSummary[]> {
  const rows = await db.query.kitchenMenus.findMany({
    with: {
      kitchenMenuDishes: true,
    },
    orderBy: asc(kitchenMenus.name),
  });

  return rows.map((menu) => {
    return {
      id: menu.id,
      name: menu.name,
      dishCount: menu.kitchenMenuDishes.length,
      dishIds: menu.kitchenMenuDishes.map((kmd) => kmd.dishId),
    };
  });
}

export async function getKitchenMenuById(id: number): Promise<KitchenMenuDetail | null> {
  const menu = await db.query.kitchenMenus.findFirst({
    where: eq(kitchenMenus.id, id),
    with: {
      kitchenMenuDishes: {
        with: {
          dish: {
            with: { category: true },
          },
        },
      },
    },
  });

  if (!menu) {
    return null;
  }

  const categoryMap = new Map<number, CategoryWithDishes>();

  for (const kmd of menu.kitchenMenuDishes) {
    const dish = kmd.dish;
    const category = dish.category;

    if (!categoryMap.has(category.id)) {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        selectionRule: category.selectionRule,
        dishes: [],
        // Temporary sort order just for sorting the categories later
        _sortOrder: category.sortOrder,
      } as CategoryWithDishes & { _sortOrder: number });
    }

    categoryMap.get(category.id)!.dishes.push({
      id: dish.id,
      name: dish.name,
      _sortOrder: dish.sortOrder,
    } as DishItem & { _sortOrder: number });
  }

  const categories = Array.from(categoryMap.values())
    .sort((a: any, b: any) => a._sortOrder - b._sortOrder)
    .map((c: any) => {
      c.dishes.sort((a: any, b: any) => a._sortOrder - b._sortOrder);
      // Clean up the temporary field
      const { _sortOrder: _, ...cleanedCategory } = c;
      return {
        ...cleanedCategory,
        dishes: c.dishes.map((d: any) => {
          const { _sortOrder: __, ...cleanedDish } = d;
          return cleanedDish;
        }),
      };
    });

  return {
    id: menu.id,
    name: menu.name,
    categories,
  };
}

function normalizeName(name: string) {
  return name.trim();
}

function parseDishIds(formData: FormData) {
  return formData
    .getAll("dishIds")
    .map((value) => Number(value))
    .filter((id) => !Number.isNaN(id));
}

async function syncKitchenMenuDishes(kitchenMenuId: number, dishIds: number[]) {
  const uniqueIds = [...new Set(dishIds)];

  if (uniqueIds.length > 0) {
    const found = await db.query.dishes.findMany({
      where: inArray(dishes.id, uniqueIds),
    });

    if (found.length !== uniqueIds.length) {
      return { error: "One or more selected dishes no longer exist." };
    }
  }

  await db.delete(kitchenMenuDishes).where(eq(kitchenMenuDishes.kitchenMenuId, kitchenMenuId));

  if (uniqueIds.length > 0) {
    await db.insert(kitchenMenuDishes).values(
      uniqueIds.map((dishId) => ({
        kitchenMenuId,
        dishId,
      })),
    );
  }

  return { success: true as const };
}

export async function createKitchenMenu(formData: FormData) {
  const name = normalizeName(String(formData.get("name") ?? ""));
  const dishIds = parseDishIds(formData);

  if (!name) {
    return { error: "Menu name is required." };
  }
  if (name.length > 120) {
    return { error: "Menu name must be 120 characters or less." };
  }
  if (dishIds.length === 0) {
    return { error: "Select at least one dish." };
  }

  const [created] = await db
    .insert(kitchenMenus)
    .values({ name })
    .returning({ id: kitchenMenus.id });

  const syncResult = await syncKitchenMenuDishes(created.id, dishIds);
  if (syncResult.error) {
    await db.delete(kitchenMenus).where(eq(kitchenMenus.id, created.id));
    return { error: syncResult.error };
  }

  revalidatePath("/kitchen-menus");
  revalidatePath(`/kitchen-menus/${created.id}`);
  return { success: true as const, id: created.id };
}

export async function updateKitchenMenu(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = normalizeName(String(formData.get("name") ?? ""));
  const dishIds = parseDishIds(formData);

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid kitchen menu." };
  }
  if (!name) {
    return { error: "Menu name is required." };
  }
  if (dishIds.length === 0) {
    return { error: "Select at least one dish." };
  }

  const [updated] = await db
    .update(kitchenMenus)
    .set({ name, updatedAt: new Date() })
    .where(eq(kitchenMenus.id, id))
    .returning({ id: kitchenMenus.id });

  if (!updated) {
    return { error: "Kitchen menu not found." };
  }

  const syncResult = await syncKitchenMenuDishes(id, dishIds);
  if (syncResult.error) {
    return { error: syncResult.error };
  }

  revalidatePath("/kitchen-menus");
  revalidatePath(`/kitchen-menus/${id}`);
  return { success: true as const };
}

export async function deleteKitchenMenu(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid kitchen menu." };
  }

  const [deleted] = await db
    .delete(kitchenMenus)
    .where(eq(kitchenMenus.id, id))
    .returning({ id: kitchenMenus.id });

  if (!deleted) {
    return { error: "Kitchen menu not found." };
  }

  revalidatePath("/kitchen-menus");
  return { success: true as const };
}
