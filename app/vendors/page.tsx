import type { Metadata } from "next";

import { getVendorsPageData } from "@/app/vendors/actions";
import { PageHeader } from "@/components/page-header";
import { VendorsView } from "@/components/vendors/vendors-view";

export const metadata: Metadata = {
  title: "Vendors",
};

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const { vendors, materials } = await getVendorsPageData();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Vendors" />
      <VendorsView vendors={vendors} materials={materials} />
    </div>
  );
}
