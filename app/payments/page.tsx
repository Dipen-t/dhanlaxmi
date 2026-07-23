import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { getOrdersForSelection, getAllVendors } from "./actions";
import { PaymentsClient } from "./client";

export const metadata: Metadata = {
  title: "Payments",
};

export const dynamic = "force-dynamic";

async function PaymentsContent() {
  const orders = await getOrdersForSelection();
  const allVendors = await getAllVendors();

  return (
    <PaymentsClient orders={orders} allVendors={allVendors} />
  );
}

export default function PaymentsPage() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Payments" />
      <Suspense fallback={<div className="mt-8 animate-pulse rounded-xl bg-surface h-64" />}>
        <PaymentsContent />
      </Suspense>
    </div>
  );
}
