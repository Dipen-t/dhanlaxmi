import type { Metadata } from "next";

import { getCatalogCategories, getMenus } from "@/app/menus/actions";
import { PageHeader } from "@/components/page-header";
import { MenusView } from "@/components/menus/menus-view";

export const metadata: Metadata = {
  title: "Menus",
};

export const dynamic = "force-dynamic";

export default async function MenusPage() {
  const [menus, catalog] = await Promise.all([
    getMenus(),
    getCatalogCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Menus" />
      <MenusView menus={menus} catalog={catalog} />
    </div>
  );
}
