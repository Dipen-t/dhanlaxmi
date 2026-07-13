"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  kitchenDishCategories,
  kitchenDishes,
  kitchenMenuDishes,
  kitchenMenus,
} from "@/db/schema";

export type KitchenDishItem = {
  id: number;
  name: string;
  quantity?: string;
};

export type KitchenCategoryWithDishes = {
  id: number;
  name: string;
  selectionRule: string;
  isQtyField: boolean;
  dishes: KitchenDishItem[];
};

export type KitchenMenuSummary = {
  id: number;
  name: string;
  venue?: string | null;
  date?: Date | null;
  numberOfPersons?: number | null;
  mealType?: "Lunch" | "Dinner" | null;
  dishCount: number;
  dishes: { id: number; quantity?: string }[];
};

export type KitchenMenuDetail = {
  id: number;
  name: string;
  venue?: string | null;
  date?: Date | null;
  numberOfPersons?: number | null;
  mealType?: "Lunch" | "Dinner" | null;
  categories: KitchenCategoryWithDishes[];
};

export async function getKitchenCatalog(): Promise<KitchenCategoryWithDishes[]> {
  const rows = await db.query.kitchenDishCategories.findMany({
    with: { kitchenDishes: true },
    orderBy: asc(kitchenDishCategories.sortOrder),
  });

  return rows.map((category) => ({
    id: category.id,
    name: category.name,
    selectionRule: category.selectionRule,
    isQtyField: category.isQtyField,
    dishes: category.kitchenDishes
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((dish) => ({ id: dish.id, name: dish.name })),
  }));
}

export async function getKitchenMenus(): Promise<KitchenMenuSummary[]> {
  const rows = await db.query.kitchenMenus.findMany({
    with: {
      kitchenMenuDishes: true,
    },
    orderBy: asc(kitchenMenus.name),
  });

  return rows.map((menu) => ({
    id: menu.id,
    name: menu.name,
    venue: menu.venue,
    date: menu.date,
    numberOfPersons: menu.numberOfPersons,
    mealType: menu.mealType as any,
    dishCount: menu.kitchenMenuDishes.length,
    dishes: menu.kitchenMenuDishes.map((kmd) => ({
      id: kmd.kitchenDishId,
      quantity: kmd.quantity ?? undefined,
    })),
  }));
}

export async function getKitchenMenuById(id: number): Promise<KitchenMenuDetail | null> {
  const menu = await db.query.kitchenMenus.findFirst({
    where: eq(kitchenMenus.id, id),
    with: {
      kitchenMenuDishes: {
        with: {
          kitchenDish: {
            with: { category: true },
          },
        },
      },
    },
  });

  if (!menu) {
    return null;
  }

  const categoryMap = new Map<number, KitchenCategoryWithDishes & { _sortOrder: number }>();

  for (const kmd of menu.kitchenMenuDishes) {
    const dish = kmd.kitchenDish;
    const category = dish.category;

    if (!categoryMap.has(category.id)) {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        selectionRule: category.selectionRule,
        isQtyField: category.isQtyField,
        dishes: [],
        _sortOrder: category.sortOrder,
      });
    }

    categoryMap.get(category.id)!.dishes.push({
      id: dish.id,
      name: dish.name,
      quantity: kmd.quantity ?? undefined,
      _sortOrder: dish.sortOrder,
    } as KitchenDishItem & { _sortOrder: number });
  }

  const categories = Array.from(categoryMap.values())
    .sort((a, b) => a._sortOrder - b._sortOrder)
    .map((c) => {
      (c.dishes as (KitchenDishItem & { _sortOrder?: number })[]).sort(
        (a, b) => (a._sortOrder ?? 0) - (b._sortOrder ?? 0),
      );
      const { _sortOrder: _, ...cleaned } = c;
      return {
        ...cleaned,
        dishes: c.dishes.map((d: any) => {
          const { _sortOrder: __, ...cleanedDish } = d;
          return cleanedDish;
        }),
      };
    });

  return {
    id: menu.id,
    name: menu.name,
    venue: menu.venue,
    date: menu.date,
    numberOfPersons: menu.numberOfPersons,
    mealType: menu.mealType as any,
    categories,
  };
}

function normalizeName(name: string) {
  return name.trim();
}

function parseDishes(formData: FormData): { id: number; quantity?: string }[] {
  const data = formData.get("dishes");
  if (!data || typeof data !== "string") return [];
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item.id === "number");
  } catch {
    return [];
  }
}

async function syncKitchenMenuDishes(kitchenMenuId: number, dishes: { id: number; quantity?: string }[]) {
  const uniqueIds = [...new Set(dishes.map((d) => d.id))];

  if (uniqueIds.length > 0) {
    const found = await db.query.kitchenDishes.findMany({
      where: inArray(kitchenDishes.id, uniqueIds),
    });

    if (found.length !== uniqueIds.length) {
      return { error: "One or more selected dishes no longer exist." };
    }
  }

  await db.delete(kitchenMenuDishes).where(eq(kitchenMenuDishes.kitchenMenuId, kitchenMenuId));

  if (uniqueIds.length > 0) {
    await db.insert(kitchenMenuDishes).values(
      dishes.map((dish) => ({
        kitchenMenuId,
        kitchenDishId: dish.id,
        quantity: dish.quantity || null,
      })),
    );
  }

  return { success: true as const };
}

export async function createKitchenMenu(formData: FormData) {
  const name = normalizeName(String(formData.get("name") ?? ""));
  const venue = String(formData.get("venue") ?? "").trim() || null;
  const dateStr = String(formData.get("date") ?? "").trim();
  const date = dateStr ? new Date(dateStr) : null;
  const numberOfPersonsStr = String(formData.get("numberOfPersons") ?? "").trim();
  const numberOfPersons = numberOfPersonsStr ? parseInt(numberOfPersonsStr, 10) : null;
  const mealTypeRaw = String(formData.get("mealType") ?? "").trim();
  const mealType = ["Lunch", "Dinner"].includes(mealTypeRaw) ? mealTypeRaw as "Lunch" | "Dinner" : null;
  
  const dishes = parseDishes(formData);

  if (!name) {
    return { error: "Menu name is required." };
  }
  if (name.length > 120) {
    return { error: "Menu name must be 120 characters or less." };
  }
  if (dishes.length === 0) {
    return { error: "Select at least one dish." };
  }

  const [created] = await db
    .insert(kitchenMenus)
    .values({ name, venue, date, numberOfPersons, mealType })
    .returning({ id: kitchenMenus.id });

  const syncResult = await syncKitchenMenuDishes(created.id, dishes);
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
  const venue = String(formData.get("venue") ?? "").trim() || null;
  const dateStr = String(formData.get("date") ?? "").trim();
  const date = dateStr ? new Date(dateStr) : null;
  const numberOfPersonsStr = String(formData.get("numberOfPersons") ?? "").trim();
  const numberOfPersons = numberOfPersonsStr ? parseInt(numberOfPersonsStr, 10) : null;
  const mealTypeRaw = String(formData.get("mealType") ?? "").trim();
  const mealType = ["Lunch", "Dinner"].includes(mealTypeRaw) ? mealTypeRaw as "Lunch" | "Dinner" : null;

  const dishes = parseDishes(formData);

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid kitchen menu." };
  }
  if (!name) {
    return { error: "Menu name is required." };
  }
  if (dishes.length === 0) {
    return { error: "Select at least one dish." };
  }

  const [updated] = await db
    .update(kitchenMenus)
    .set({ name, venue, date, numberOfPersons, mealType, updatedAt: new Date() })
    .where(eq(kitchenMenus.id, id))
    .returning({ id: kitchenMenus.id });

  if (!updated) {
    return { error: "Kitchen menu not found." };
  }

  const syncResult = await syncKitchenMenuDishes(id, dishes);
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
