"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { generateMenuPdfBuffer } from "@/lib/menus/generate-menu-pdf";
import { getPdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { sanitizeFilename } from "@/lib/menus/sanitize-filename";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import {
  dishCategories,
  dishes,
  menuCategories,
  menus,
} from "@/db/schema";

export type DishItem = {
  id: number;
  name: string;
};

export type CategoryWithDishes = {
  id: number;
  name: string;
  selectionRule: string;
  dishes: DishItem[];
};

export type MenuSummary = {
  id: number;
  name: string;
  categoryCount: number;
  dishCount: number;
  categoryIds: number[];
};

export type MenuDetail = {
  id: number;
  name: string;
  categories: CategoryWithDishes[];
};

export async function getCatalogCategories(): Promise<CategoryWithDishes[]> {
  const rows = await db.query.dishCategories.findMany({
    with: { dishes: true },
    orderBy: asc(dishCategories.sortOrder),
  });

  return rows.map((category) => ({
    id: category.id,
    name: category.name,
    selectionRule: category.selectionRule,
    dishes: category.dishes
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((dish) => ({ id: dish.id, name: dish.name })),
  }));
}

export async function getMenus(): Promise<MenuSummary[]> {
  const rows = await db.query.menus.findMany({
    with: {
      menuCategories: {
        with: {
          category: {
            with: { dishes: true },
          },
        },
      },
    },
    orderBy: asc(menus.name),
  });

  return rows.map((menu) => {
    const categories = menu.menuCategories.map((link) => link.category);
    const categoryIds = categories.map((category) => category.id);
    const dishCount = categories.reduce(
      (sum, category) => sum + category.dishes.length,
      0,
    );

    return {
      id: menu.id,
      name: menu.name,
      categoryCount: categories.length,
      dishCount,
      categoryIds,
    };
  });
}

export async function getMenuById(id: number): Promise<MenuDetail | null> {
  const menu = await db.query.menus.findFirst({
    where: eq(menus.id, id),
    with: {
      menuCategories: {
        with: {
          category: {
            with: { dishes: true },
          },
        },
      },
    },
  });

  if (!menu) {
    return null;
  }

  const categories = menu.menuCategories
    .map((link) => link.category)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      selectionRule: category.selectionRule,
      dishes: category.dishes
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((dish) => ({ id: dish.id, name: dish.name })),
    }));

  return {
    id: menu.id,
    name: menu.name,
    categories,
  };
}

function normalizeName(name: string) {
  return name.trim();
}

function parseCategoryIds(formData: FormData) {
  return formData
    .getAll("categoryIds")
    .map((value) => Number(value))
    .filter((id) => !Number.isNaN(id));
}

async function syncMenuCategories(menuId: number, categoryIds: number[]) {
  const uniqueIds = [...new Set(categoryIds)];

  if (uniqueIds.length > 0) {
    const found = await db.query.dishCategories.findMany({
      where: inArray(dishCategories.id, uniqueIds),
    });

    if (found.length !== uniqueIds.length) {
      return { error: "One or more selected categories no longer exist." };
    }
  }

  await db.delete(menuCategories).where(eq(menuCategories.menuId, menuId));

  if (uniqueIds.length > 0) {
    await db.insert(menuCategories).values(
      uniqueIds.map((categoryId) => ({
        menuId,
        categoryId,
      })),
    );
  }

  return { success: true as const };
}

export async function createMenu(formData: FormData) {
  const name = normalizeName(String(formData.get("name") ?? ""));
  const categoryIds = parseCategoryIds(formData);

  if (!name) {
    return { error: "Menu name is required." };
  }
  if (name.length > 120) {
    return { error: "Menu name must be 120 characters or less." };
  }
  if (categoryIds.length === 0) {
    return { error: "Select at least one category." };
  }

  const [created] = await db
    .insert(menus)
    .values({ name })
    .returning({ id: menus.id });

  const syncResult = await syncMenuCategories(created.id, categoryIds);
  if (syncResult.error) {
    await db.delete(menus).where(eq(menus.id, created.id));
    return { error: syncResult.error };
  }

  revalidatePath("/menus");
  revalidatePath(`/menus/${created.id}`);
  return { success: true as const, id: created.id };
}

export async function updateMenu(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = normalizeName(String(formData.get("name") ?? ""));
  const categoryIds = parseCategoryIds(formData);

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid menu." };
  }
  if (!name) {
    return { error: "Menu name is required." };
  }
  if (categoryIds.length === 0) {
    return { error: "Select at least one category." };
  }

  const [updated] = await db
    .update(menus)
    .set({ name, updatedAt: new Date() })
    .where(eq(menus.id, id))
    .returning({ id: menus.id });

  if (!updated) {
    return { error: "Menu not found." };
  }

  const syncResult = await syncMenuCategories(id, categoryIds);
  if (syncResult.error) {
    return { error: syncResult.error };
  }

  revalidatePath("/menus");
  revalidatePath(`/menus/${id}`);
  return { success: true as const };
}

export async function deleteMenu(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid menu." };
  }

  const [deleted] = await db
    .delete(menus)
    .where(eq(menus.id, id))
    .returning({ id: menus.id });

  if (!deleted) {
    return { error: "Menu not found." };
  }

  revalidatePath("/menus");
  return { success: true as const };
}

export async function shareMenuViaWhatsApp(phone: string, text: string, pdfUrl: string) {
  if (!phone) {
    return { error: "Phone number is required." };
  }

  try {
    const result = await sendWhatsAppMessage(phone, text, pdfUrl);
    if (!result) {
      return { error: "Failed to send WhatsApp message. Please check the server configuration." };
    }

    return { success: true as const };
  } catch (error) {
    console.error("WhatsApp menu share error:", error);
    return { error: "Could not send PDF. Try again." };
  }
}
