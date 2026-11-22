import type { MenuDetail, CategoryWithDishes } from "@/app/menus/actions";
import { isHiTeaCategory } from "./hi-tea";

export type OrderForPdf = {
  id: number;
  orderId?: string;
  customerName?: string | null;
  venue?: string | null;
  date?: string | null;
  mealType?: string | null;
  menuDishes: { dishId: number; name: string; categoryId: number; categoryName: string }[];
  hiTeaNotes?: string | null;
};

export function orderToMenuDetail(order: OrderForPdf): MenuDetail {
  const categoriesMap = new Map<number, CategoryWithDishes>();

  for (const dish of order.menuDishes) {
    const existing = categoriesMap.get(dish.categoryId) ?? {
      id: dish.categoryId,
      name: dish.categoryName,
      selectionRule: "",
      dishes: [],
    };
    existing.dishes.push({ id: dish.dishId, name: dish.name });
    categoriesMap.set(dish.categoryId, existing);
  }

  const categories = [...categoriesMap.values()];

  if (order.hiTeaNotes?.trim()) {
    const hiTeaCat = categories.find((c) => isHiTeaCategory(c.name));
    if (hiTeaCat) {
      hiTeaCat.selectionRule = order.hiTeaNotes.trim();
    } else {
      categories.push({
        id: 999999,
        name: "Hi-tea Notes",
        selectionRule: "",
        dishes: [{ id: 999999, name: order.hiTeaNotes.trim() }],
      });
    }
  }

  const title = order.customerName?.trim()
    ? `${order.customerName.trim()} - Menu`
    : `Order ${order.orderId || order.id} - Menu`;

  return {
    id: order.id,
    name: title,
    categories,
  };
}

export async function generateOrderMenuPdfBuffer(order: OrderForPdf): Promise<Buffer> {
  const { getPdfLogoAssets } = await import("@/lib/menus/prepare-pdf-logo");
  const { generateMenuPdfBuffer } = await import("@/lib/menus/generate-menu-pdf");
  const menuDetail = orderToMenuDetail(order);
  const logo = await getPdfLogoAssets();
  return generateMenuPdfBuffer(menuDetail, logo, "standard", {
    fontFamily: "SourceSans",
    fontSize: "10pt",
  });
}
