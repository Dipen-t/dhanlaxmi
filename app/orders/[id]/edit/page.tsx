import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getMenuById, getMenus } from "@/app/menus/actions";
import { getOrder, getSuggestedOrderId } from "@/app/orders/actions";
import { getMaterials } from "@/app/raw-materials/actions";
import { OrderForm } from "@/components/orders/order-form";

export const metadata: Metadata = {
  title: "Edit Order",
};

export const dynamic = "force-dynamic";

type EditOrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    notFound();
  }

  const [order, suggestedOrderId, rawMaterials, menus] = await Promise.all([
    getOrder(String(orderId)),
    getSuggestedOrderId(),
    getMaterials(),
    getMenus(),
  ]);

  if (!order) {
    notFound();
  }

  const initialMenu = order.menuId ? await getMenuById(order.menuId) : null;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-2 sm:px-6">
      <OrderForm
        order={order}
        suggestedOrderId={suggestedOrderId}
        rawMaterials={rawMaterials}
        menus={menus}
        initialMenu={initialMenu}
      />
    </div>
  );
}
