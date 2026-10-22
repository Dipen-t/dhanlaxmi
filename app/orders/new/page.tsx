import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getSuggestedOrderId } from "@/app/orders/actions";
import { getCatalogCategories, getMenus } from "@/app/menus/actions";
import { getMaterials } from "@/app/raw-materials/actions";
import { OrderForm } from "@/components/orders/order-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Order",
};

export default async function NewOrderPage() {
  const [suggestedOrderId, rawMaterials, menus, menuCatalog] = await Promise.all([
    getSuggestedOrderId(),
    getMaterials(),
    getMenus(),
    getCatalogCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-2 sm:px-6">
      <OrderForm
        order={null}
        suggestedOrderId={suggestedOrderId}
        rawMaterials={rawMaterials}
        menus={menus}
        menuCatalog={menuCatalog}
      />
    </div>
  );
}
