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
  deliveryTime?: string | null;
  numberOfPersons?: number | null;
  mealType?: "Lunch" | "Dinner" | null;
  dishCount: number;
  dishes: { id: number; quantity?: string; sortOrder: number }[];
};

export type KitchenMenuDetail = {
  id: number;
  name: string;
  venue?: string | null;
  date?: Date | null;
  deliveryTime?: string | null;
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
    deliveryTime: menu.deliveryTime,
    numberOfPersons: menu.numberOfPersons,
    mealType: menu.mealType,
    dishCount: menu.kitchenMenuDishes.length,
    dishes: [...menu.kitchenMenuDishes]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((kmd) => ({
      id: kmd.kitchenDishId,
      quantity: kmd.quantity ?? undefined,
      sortOrder: kmd.sortOrder,
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

  const categories: KitchenCategoryWithDishes[] = [];

  for (const kmd of [...menu.kitchenMenuDishes].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const dish = kmd.kitchenDish;
    const category = dish.category;

    let group = categories.at(-1);
    if (!group || group.id !== category.id) {
      group = {
        id: category.id,
        name: category.name,
        selectionRule: category.selectionRule,
        isQtyField: category.isQtyField,
        dishes: [],
      };
      categories.push(group);
    }

    group.dishes.push({
      id: dish.id,
      name: dish.name,
      quantity: kmd.quantity ?? undefined,
    });
  }

  return {
    id: menu.id,
    name: menu.name,
    venue: menu.venue,
    date: menu.date,
    deliveryTime: menu.deliveryTime,
    numberOfPersons: menu.numberOfPersons,
    mealType: menu.mealType,
    categories,
  };
}

function normalizeName(name: string) {
  return name.trim();
}

type SelectedKitchenDish = { id: number; quantity?: string; sortOrder: number };

function parseDishes(formData: FormData): SelectedKitchenDish[] {
  const data = formData.get("dishes");
  if (!data || typeof data !== "string") return [];
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => Number.isInteger(item?.id) && item.id > 0)
      .map((item, index) => ({
        id: item.id,
        quantity:
          typeof item.quantity === "string"
            ? item.quantity.trim().slice(0, 120) || undefined
            : undefined,
        sortOrder: index,
      }));
  } catch {
    return [];
  }
}

async function syncKitchenMenuDishes(kitchenMenuId: number, dishes: SelectedKitchenDish[]) {
  const uniqueIds = [...new Set(dishes.map((d) => d.id))];

  if (uniqueIds.length !== dishes.length) {
    return { error: "A dish was selected more than once." };
  }

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
        sortOrder: dish.sortOrder,
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
  const deliveryTime = String(formData.get("deliveryTime") ?? "").trim() || null;
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
  if (deliveryTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(deliveryTime)) {
    return { error: "Enter a valid delivery time." };
  }
  if (dishes.length === 0) {
    return { error: "Select at least one dish." };
  }

  const [created] = await db
    .insert(kitchenMenus)
    .values({ name, venue, date, deliveryTime, numberOfPersons, mealType })
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
  const deliveryTime = String(formData.get("deliveryTime") ?? "").trim() || null;
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
  if (deliveryTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(deliveryTime)) {
    return { error: "Enter a valid delivery time." };
  }
  if (dishes.length === 0) {
    return { error: "Select at least one dish." };
  }

  const [updated] = await db
    .update(kitchenMenus)
    .set({ name, venue, date, deliveryTime, numberOfPersons, mealType, updatedAt: new Date() })
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
