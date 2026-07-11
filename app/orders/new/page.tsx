import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getSuggestedOrderId } from "@/app/orders/actions";
import { getMaterials } from "@/app/raw-materials/actions";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "New Order",
};

export default async function NewOrderPage() {
  const [suggestedOrderId, rawMaterials] = await Promise.all([
    getSuggestedOrderId(),
    getMaterials(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Create New Order" />
      <div className="mt-8">
        <OrderForm
          order={null}
          suggestedOrderId={suggestedOrderId}
          rawMaterials={rawMaterials}
        />
      </div>
    </div>
  );
}
