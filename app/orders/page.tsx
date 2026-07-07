import type { Metadata } from "next";

import { getOrders, getSuggestedOrderId } from "@/app/orders/actions";
import { getMaterials } from "@/app/raw-materials/actions";
import { PageHeader } from "@/components/page-header";
import { OrdersView } from "@/components/orders/orders-view";

export const metadata: Metadata = {
  title: "Orders",
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, suggestedOrderId, rawMaterials] = await Promise.all([
    getOrders(),
    getSuggestedOrderId(),
    getMaterials(),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Orders" />
      <OrdersView orders={orders} suggestedOrderId={suggestedOrderId} rawMaterials={rawMaterials} />
    </div>
  );
}
