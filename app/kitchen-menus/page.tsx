import type { Metadata } from "next";
import { Suspense } from "react";

import { getKitchenMenus, getKitchenCatalog } from "@/app/kitchen-menus/actions";
import { KitchenMenusView } from "@/components/kitchen-menus/kitchen-menus-view";
import { PageHeader } from "@/components/page-header";
import { SectionListSkeleton } from "@/components/section-list-skeleton";

export const metadata: Metadata = {
  title: "Kitchen Menus",
};

export const dynamic = "force-dynamic";

async function KitchenMenusContent() {
  const [menus, catalog] = await Promise.all([
    getKitchenMenus(),
    getKitchenCatalog(),
  ]);

  return <KitchenMenusView menus={menus} catalog={catalog} />;
}

export default function KitchenMenusPage() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Kitchen Menus" />
      <Suspense fallback={<SectionListSkeleton />}>
        <KitchenMenusContent />
      </Suspense>
    </div>
  );
}
