import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMenuById } from "@/app/menus/actions";
import { MenuPdfDownload } from "@/components/menus/menu-pdf-download";
import { MenuWhatsappShare } from "@/components/menus/menu-whatsapp-share";
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

  const dishTotal = menu.categories.reduce(
    (sum, category) => sum + category.dishes.length,
    0,
  );

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title={menu.name} />

      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base text-muted text-pretty">
            {menu.categories.length}{" "}
            {menu.categories.length === 1 ? "category" : "categories"} ·{" "}
            {dishTotal} dishes · preview for sharing
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <MenuWhatsappShare
              menuId={menu.id}
              menuName={menu.name}
              variant="button"
            />
            <MenuPdfDownload
              menuId={menu.id}
              menuName={menu.name}
              variant="button"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {menu.categories.map((category) => (
          <section
            key={category.id}
            className="overflow-hidden rounded-xl border border-border bg-background"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/60 px-4 py-3 sm:px-5">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground md:text-lg">
                {category.name}
              </h2>
              <span className="rounded-md bg-primary-soft px-2.5 py-1 text-sm font-medium text-primary">
                {category.selectionRule}
              </span>
            </div>
            <ol className="divide-y divide-border">
              {category.dishes.map((dish, index) => (
                <li
                  key={dish.id}
                  className="flex items-start gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-sm font-medium tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-base text-foreground">
                    {dish.name}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
