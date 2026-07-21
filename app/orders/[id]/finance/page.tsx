import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { getOrderFinances } from "./actions";
import { getOrder } from "@/app/orders/actions";
import { OrderFinanceClient } from "./client";

export const metadata: Metadata = {
  title: "Order Finance",
};

export const dynamic = "force-dynamic";

async function OrderFinanceContent({ orderId }: { orderId: string }) {
  const order = await getOrder(orderId);
  if (!order) {
    notFound();
  }
  const payments = await getOrderFinances(orderId);

  return (
    <OrderFinanceClient order={order} payments={payments} />
  );
}

export default async function OrderFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Order Finance" />
      <Suspense fallback={<div className="mt-8 animate-pulse rounded-xl bg-surface h-64" />}>
        <OrderFinanceContent orderId={id} />
      </Suspense>
    </div>
  );
}
