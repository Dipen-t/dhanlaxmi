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

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={menu.name} />
        <div className="flex items-center gap-2">
          <MenuWhatsappShare
            menuId={menu.id}
            menuName={menu.name}
            variant="button"
            className="shrink-0"
          />
          <MenuPdfDownload
            menuId={menu.id}
            menuName={menu.name}
            variant="button"
            className="shrink-0"
          />
        </div>
      </div>

      <p className="mb-6 text-sm text-muted [text-wrap:pretty]">
        Preview for sharing with clients. Each section shows how many dishes
        the client can pick.
      </p>

      <div className="space-y-4">
        {menu.categories.map((category) => (
          <section
            key={category.id}
            className="rounded-xl border border-border bg-background p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {category.name}
              </h2>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                {category.selectionRule}
              </span>
            </div>
            <ol className="mt-3 space-y-2">
              {category.dishes.map((dish, index) => (
                <li
                  key={dish.id}
                  className="flex items-start gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-border text-xs text-muted">
                    {index + 1}
                  </span>
                  <span className="text-foreground">{dish.name}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
