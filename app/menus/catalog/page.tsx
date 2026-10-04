import type { Metadata } from "next";
import Link from "next/link";
import { getCatalogCategories } from "@/app/menus/actions";
import { MenuCatalogManager } from "@/components/menus/menu-catalog-manager";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Category & Dishes" };
export const dynamic = "force-dynamic";

export default async function MenuCatalogPage() {
  const catalog = await getCatalogCategories();
  return <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
    <Link href="/menus" className="mb-4 inline-flex min-h-10 items-center text-sm font-medium text-primary">← Back to menus</Link>
    <PageHeader title="Category & Dishes" />
    <p className="mb-6 text-sm text-muted">Manage the catalog used by your menus. Category names, selection rules, and dishes appear in downloaded PDFs.</p>
    <MenuCatalogManager catalog={catalog} />
  </div>;
}
