"use server";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { categoryImageKeyById } from "@/lib/menus/category-images";
import { sendMenuPdfViaWhatsApp } from "@/lib/whatsapp";
import { sanitizeFilename } from "@/lib/menus/sanitize-filename";
import { getWhatsAppPdfUrl } from "@/lib/whatsapp-pdf-url";
import {
  dishCategories,
  menuCategories,
  menus,
} from "@/db/schema";

let menuCategorySortOrderReady: Promise<void> | null = null;

function isMissingSortOrderError(error: unknown) {
  const parts: string[] = [];
  let current: unknown = error;
  for (let i = 0; i < 4 && current; i += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = "cause" in current ? current.cause : null;
      continue;
    }
    parts.push(String(current));
    break;
  }
  const text = parts.join("\n").toLowerCase();
  return text.includes("sort_order") && text.includes("does not exist");
}

/** Termux / older DBs may lack this column until migrate/push — create it on demand. */
function ensureMenuCategorySortOrder() {
  if (!menuCategorySortOrderReady) {
    menuCategorySortOrderReady = db
      .execute(
        sql`ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0`,
      )
      .then(() => undefined)
      .catch((error) => {
        menuCategorySortOrderReady = null;
        throw error;
      });
  }
  return menuCategorySortOrderReady;
}

async function withMenuCategorySortOrder<T>(run: () => Promise<T>): Promise<T> {
  await ensureMenuCategorySortOrder();
  try {
    return await run();
  } catch (error) {
    if (!isMissingSortOrderError(error)) throw error;
    // Column missing on this DB (common when Termux uses a different DATABASE_URL).
    menuCategorySortOrderReady = null;
    await ensureMenuCategorySortOrder();
    return run();
  }
}

export type DishItem = {
  id: number;
  name: string;
};

export type CategoryWithDishes = {
  id: number;
  name: string;
  selectionRule: string;
  imageKey?: string;
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
  return withMenuCategorySortOrder(async () => {
    const rows = await db.query.dishCategories.findMany({
      with: { dishes: true },
      orderBy: asc(dishCategories.sortOrder),
    });

    return rows.map((category) => ({
      id: category.id,
      name: category.name,
      selectionRule: category.selectionRule,
      imageKey: categoryImageKeyById(category.id),
      dishes: category.dishes
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((dish) => ({ id: dish.id, name: dish.name })),
    }));
  });
}

export async function getMenus(): Promise<MenuSummary[]> {
  return withMenuCategorySortOrder(async () => {
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
  });
}

export async function getMenuById(id: number): Promise<MenuDetail | null> {
  return withMenuCategorySortOrder(async () => {
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
      .slice()
      .sort((a, b) => {
        const orderDiff = a.sortOrder - b.sortOrder;
        if (orderDiff !== 0) return orderDiff;
        return a.category.sortOrder - b.category.sortOrder;
      })
      .map((link) => {
        const category = link.category;
        return {
          id: category.id,
          name: category.name,
          selectionRule: category.selectionRule,
          imageKey: categoryImageKeyById(category.id),
          dishes: category.dishes
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((dish) => ({ id: dish.id, name: dish.name })),
        };
      });

    return {
      id: menu.id,
      name: menu.name,
      categories,
    };
  });
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

  const existing = await db.query.menuCategories.findMany({
    where: eq(menuCategories.menuId, menuId),
  });
  const existingOrder = new Map(
    existing.map((row) => [row.categoryId, row.sortOrder] as const),
  );

  const keptIds = uniqueIds
    .filter((id) => existingOrder.has(id))
    .sort((a, b) => (existingOrder.get(a) ?? 0) - (existingOrder.get(b) ?? 0));
  const addedIds = uniqueIds.filter((id) => !existingOrder.has(id));
  const orderedIds = [...keptIds, ...addedIds];

  await db.delete(menuCategories).where(eq(menuCategories.menuId, menuId));

  if (orderedIds.length > 0) {
    await db.insert(menuCategories).values(
      orderedIds.map((categoryId, index) => ({
        menuId,
        categoryId,
        sortOrder: index,
      })),
    );
  }

  return { success: true as const };
}

export async function reorderMenuCategories(
  menuId: number,
  categoryIds: number[],
) {
  if (!menuId || Number.isNaN(menuId)) {
    return { error: "Invalid menu." };
  }

  const uniqueIds = [...new Set(categoryIds.filter((id) => Number.isFinite(id)))];
  if (uniqueIds.length === 0) {
    return { error: "No categories to reorder." };
  }

  const existing = await db.query.menuCategories.findMany({
    where: eq(menuCategories.menuId, menuId),
  });
  const existingIds = new Set(existing.map((row) => row.categoryId));

  if (
    uniqueIds.length !== existing.length ||
    uniqueIds.some((id) => !existingIds.has(id))
  ) {
    return { error: "Category list does not match this menu." };
  }

  try {
    await Promise.all(
      uniqueIds.map((categoryId, index) =>
        db
          .update(menuCategories)
          .set({ sortOrder: index })
          .where(
            and(
              eq(menuCategories.menuId, menuId),
              eq(menuCategories.categoryId, categoryId),
            ),
          ),
      ),
    );
  } catch (error) {
    console.error("reorderMenuCategories failed:", error);
    return { error: "Could not save category order." };
  }

  revalidatePath("/menus");
  revalidatePath(`/menus/${menuId}`);
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

export async function shareMenuViaWhatsApp(menuId: number, phone: string, recipientName: string, theme = "standard") {
  if (!phone) {
    return { error: "Phone number is required." };
  }

  const menu = await getMenuById(menuId);
  if (!menu) {
    return { error: "Menu not found." };
  }

  if (menu.categories.length === 0) {
    return { error: "This menu has no categories to export." };
  }

  try {
    const pdfUrl = await getWhatsAppPdfUrl("menus", menuId, theme);
    const result = await sendMenuPdfViaWhatsApp(phone, pdfUrl, sanitizeFilename(menu.name), recipientName);
    if ("error" in result && result.error) {
      return { error: result.error };
    }

    return { success: true as const };
  } catch (error) {
    console.error("WhatsApp menu share error:", error);
    return { error: error instanceof Error ? error.message : "Could not send PDF. Try again." };
  }
}
