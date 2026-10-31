import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { getOrdersForSelection, getAllVendors } from "./actions";
import { ExpensesClient } from "./client";

export const metadata: Metadata = {
  title: "Expenses",
};

export const dynamic = "force-dynamic";

type ExpensesPageProps = {
  searchParams: Promise<{ orderId?: string | string[] }>;
};

async function ExpensesContent({
  initialOrderId,
}: {
  initialOrderId: number | null;
}) {
  const [orders, vendors] = await Promise.all([
    getOrdersForSelection(),
    getAllVendors(),
  ]);

  return (
    <ExpensesClient
      orders={orders}
      vendors={vendors}
      initialOrderId={initialOrderId}
    />
  );
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const parsed = raw ? Number(raw) : NaN;
  const initialOrderId =
    Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Expense Ledger" />
      <div className="mb-6">
        <p className="text-sm text-muted">
          Allocate vendor payments and other costs against each payment received
          for an order.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="mt-8 h-64 animate-pulse rounded-xl bg-surface" />
        }
      >
        <ExpensesContent initialOrderId={initialOrderId} />
      </Suspense>
    </div>
  );
}
