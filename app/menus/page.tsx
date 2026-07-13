import type { Metadata } from "next";
import { Suspense } from "react";

import { getCatalogCategories, getMenus } from "@/app/menus/actions";
import { MenusView } from "@/components/menus/menus-view";
import { PageHeader } from "@/components/page-header";
import { SectionListSkeleton } from "@/components/section-list-skeleton";

export const metadata: Metadata = {
  title: "Menus",
};

export const dynamic = "force-dynamic";

async function MenusContent() {
  const [menus, catalog] = await Promise.all([
    getMenus(),
    getCatalogCategories(),
  ]);

  return <MenusView menus={menus} catalog={catalog} />;
}

export default function MenusPage() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Menus" />
      <Suspense fallback={<SectionListSkeleton />}>
        <MenusContent />
      </Suspense>
    </div>
  );
}
