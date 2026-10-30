import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";

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
      <div className="mt-4 flex justify-end">
        <Link
          href="/kitchen-menus/catalog"
          className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings2 className="size-4" strokeWidth={1.75} aria-hidden />
          Category &amp; Dishes
        </Link>
      </div>
      <Suspense fallback={<SectionListSkeleton />}>
        <KitchenMenusContent />
      </Suspense>
    </div>
  );
}
