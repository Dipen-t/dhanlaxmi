import type { Metadata } from "next";
import { Suspense } from "react";

import { getVendorsPageData } from "@/app/vendors/actions";
import { PageHeader } from "@/components/page-header";
import { SectionListSkeleton } from "@/components/section-list-skeleton";
import { VendorsView } from "@/components/vendors/vendors-view";

export const metadata: Metadata = {
  title: "Vendors",
};

export const dynamic = "force-dynamic";

async function VendorsContent() {
  const { vendors, materials } = await getVendorsPageData();
  return <VendorsView vendors={vendors} materials={materials} />;
}

export default function VendorsPage() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Vendors" />
      <Suspense fallback={<SectionListSkeleton />}>
        <VendorsContent />
      </Suspense>
    </div>
  );
}
