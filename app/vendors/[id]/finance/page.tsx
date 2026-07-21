import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { getVendorFinances } from "./actions";
import { getVendor } from "@/app/vendors/actions";
import { VendorFinanceClient } from "./client";

export const metadata: Metadata = {
  title: "Vendor Finance",
};

export const dynamic = "force-dynamic";

async function VendorFinanceContent({ vendorId }: { vendorId: string }) {
  const vendor = await getVendor(vendorId);
  if (!vendor) {
    notFound();
  }
  const payments = await getVendorFinances(vendorId);

  return (
    <VendorFinanceClient vendor={vendor} payments={payments} />
  );
}

export default async function VendorFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Vendor Finance" />
      <Suspense fallback={<div className="mt-8 animate-pulse rounded-xl bg-surface h-64" />}>
        <VendorFinanceContent vendorId={id} />
      </Suspense>
    </div>
  );
}
