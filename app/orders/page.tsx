import type { Metadata } from "next";
import { Suspense } from "react";

import { getOrders } from "@/app/orders/actions";
import { PageHeader } from "@/components/page-header";
import { OrdersView } from "@/components/orders/orders-view";
import { SectionListSkeleton } from "@/components/section-list-skeleton";

export const metadata: Metadata = {
  title: "Orders",
};

export const dynamic = "force-dynamic";

async function OrdersContent() {
  const orders = await getOrders();
  return <OrdersView orders={orders} />;
}

export default function OrdersPage() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Orders" />
      <Suspense fallback={<SectionListSkeleton />}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}
