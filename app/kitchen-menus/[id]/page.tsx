import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getKitchenMenuById } from "@/app/kitchen-menus/actions";
import { KitchenMenuPdfDownload } from "@/components/kitchen-menus/kitchen-menu-pdf-download";
import { PageHeader } from "@/components/page-header";
import { formatDeliveryTime } from "@/lib/kitchen-menus/delivery-time";

type KitchenMenuDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: KitchenMenuDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const menu = await getKitchenMenuById(Number(id));
  return { title: menu?.name ?? "Kitchen Menu" };
}

export default async function KitchenMenuDetailPage({ params }: KitchenMenuDetailPageProps) {
  const { id } = await params;
  const menuId = Number(id);

  if (!menuId || Number.isNaN(menuId)) {
    notFound();
  }

  const menu = await getKitchenMenuById(menuId);

  if (!menu) {
    notFound();
  }

  const dishTotal = menu.categories.reduce(
    (sum, category) => sum + category.dishes.length,
    0,
  );
  const deliveryTime = formatDeliveryTime(menu.deliveryTime);

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title={menu.name} />

      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base text-muted text-pretty">
            {menu.categories.length}{" "}
            {menu.categories.length === 1 ? "category" : "categories"} ·{" "}
            {dishTotal} dishes · preview for printing
            {deliveryTime ? ` · Deliver by ${deliveryTime}` : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <KitchenMenuPdfDownload
              menuId={menu.id}
              menuName={menu.name}
              variant="button"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {menu.categories.map((category, index) => (
          <section
            key={`${category.id}-${index}`}
            className="overflow-hidden rounded-xl border border-border bg-background"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/60 px-4 py-3 sm:px-5">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground md:text-lg">
                {category.name}
              </h2>
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
