import type { Metadata } from "next";
import Link from "next/link";

import { getKitchenCatalog } from "@/app/kitchen-menus/actions";
import { KitchenCatalogManager } from "@/components/kitchen-menus/kitchen-catalog-manager";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Kitchen Category & Dishes" };
export const dynamic = "force-dynamic";

export default async function KitchenCatalogPage() {
  const catalog = await getKitchenCatalog();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/kitchen-menus" className="mb-4 inline-flex min-h-11 items-center text-sm font-medium text-primary">
        ← Back to kitchen menus
      </Link>
      <PageHeader title="Kitchen Category & Dishes" />
      <p className="mb-6 mt-4 text-sm text-muted">
        Add, rename, or remove the categories and dishes used while creating kitchen menus.
      </p>
      <KitchenCatalogManager catalog={catalog} />
    </div>
  );
}
