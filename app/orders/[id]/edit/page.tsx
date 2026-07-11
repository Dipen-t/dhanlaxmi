import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getOrder, getSuggestedOrderId } from "@/app/orders/actions";
import { getMaterials } from "@/app/raw-materials/actions";
import { OrderForm } from "@/components/orders/order-form";

export const metadata: Metadata = {
  title: "Edit Order",
};

type EditOrderPageProps = {
  params: {
    id: string;
  };
};

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const [order, suggestedOrderId, rawMaterials] = await Promise.all([
    getOrder(params.id),
    getSuggestedOrderId(),
    getMaterials(),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-6">
      <OrderForm
        order={order}
        suggestedOrderId={suggestedOrderId}
        rawMaterials={rawMaterials}
      />
    </div>
  );
}
