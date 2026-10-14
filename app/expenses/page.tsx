import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { getOrdersForSelection, getAllVendors } from "./actions";
import { ExpensesClient } from "./client";

export const metadata: Metadata = {
  title: "Expenses",
};

export const dynamic = "force-dynamic";

async function ExpensesContent() {
  const [orders, vendors] = await Promise.all([
    getOrdersForSelection(),
    getAllVendors(),
  ]);

  return (
    <ExpensesClient orders={orders} vendors={vendors} />
  );
}

export default function ExpensesPage() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 max-w-5xl">
      <PageHeader title="Expense Ledger" />
      <div className="mb-6">
        <p className="text-sm text-muted">
          View vendor payments and other expenses together for each order.
        </p>
      </div>
      <Suspense fallback={<div className="mt-8 animate-pulse rounded-xl bg-surface h-64" />}>
        <ExpensesContent />
      </Suspense>
    </div>
  );
}
