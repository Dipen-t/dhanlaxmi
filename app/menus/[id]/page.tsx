import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMenuById } from "@/app/menus/actions";
import { MenuDetailView } from "@/components/menus/menu-detail-view";
import { PageHeader } from "@/components/page-header";

type MenuDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: MenuDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const menu = await getMenuById(Number(id));
  return { title: menu?.name ?? "Menu" };
}

export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  const { id } = await params;
  const menuId = Number(id);

  if (!menuId || Number.isNaN(menuId)) {
    notFound();
  }

  const menu = await getMenuById(menuId);

  if (!menu) {
    notFound();
  }

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title={menu.name} />
      <MenuDetailView menu={menu} />
    </div>
  );
}
