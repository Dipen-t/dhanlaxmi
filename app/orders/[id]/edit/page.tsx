import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getOrder, getSuggestedOrderId } from "@/app/orders/actions";
import { getCatalogCategories } from "@/app/menus/actions";
import { getMaterials } from "@/app/raw-materials/actions";
import { OrderForm } from "@/components/orders/order-form";

export const metadata: Metadata = {
  title: "Edit Order",
};

type EditOrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    notFound();
  }

  const [order, suggestedOrderId, rawMaterials, menuCatalog] = await Promise.all([
    getOrder(String(orderId)),
    getSuggestedOrderId(),
    getMaterials(),
    getCatalogCategories(),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-2 sm:px-6">
      <OrderForm
        order={order}
        suggestedOrderId={suggestedOrderId}
        rawMaterials={rawMaterials}
        menuCatalog={menuCatalog}
      />
    </div>
  );
}
