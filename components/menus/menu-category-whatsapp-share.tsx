"use client";

import { useMemo, useState } from "react";

import type { MenuDetail } from "@/app/menus/actions";
import { WhatsappShareDialog } from "@/components/whatsapp/whatsapp-share-dialog";
import { buildCategoryStallShareText } from "@/lib/whatsapp-share";

type MenuCategoryWhatsappShareProps = {
  menu: MenuDetail;
  variant?: "icon" | "button";
  className?: string;
  buttonClassName?: string;
};

export function MenuCategoryWhatsappShare({
  menu,
  variant = "button",
  className = "",
  buttonClassName,
}: MenuCategoryWhatsappShareProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    menu.categories.map((c) => c.id),
  );

  const selectedCategories = useMemo(
    () => menu.categories.filter((c) => selectedIds.includes(c.id)),
    [menu.categories, selectedIds],
  );

  function toggle(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-medium text-foreground">
          Categories for manager / stall setup
        </p>
        <ul className="space-y-2">
          {menu.categories.map((category) => {
            const checked = selectedIds.includes(category.id);
            return (
              <li key={category.id}>
                <label className="flex min-h-10 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(category.id)}
                    className="size-4 accent-primary"
                  />
                  <span className="font-medium text-foreground">{category.name}</span>
                  <span className="text-muted">({category.dishes.length})</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <WhatsappShareDialog
        title="Share categories via WhatsApp"
        description="Sends only the selected categories so the manager can arrange stalls at the venue."
        variant={variant}
        buttonLabel="Share categories on WhatsApp"
        buttonClassName={buttonClassName}
        ariaLabel={`Share selected categories from ${menu.name}`}
        buildMessage={() =>
          buildCategoryStallShareText({
            menuName: menu.name,
            categories: selectedCategories.map((c) => ({
              name: c.name,
              dishes: c.dishes.map((d) => ({ name: d.name })),
            })),
          })
        }
      />
      {selectedCategories.length === 0 ? (
        <p className="text-xs text-muted">Select at least one category before sharing.</p>
      ) : null}
    </div>
  );
}
