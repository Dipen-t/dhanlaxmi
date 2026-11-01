"use client";

/**
 * @deprecated Prefer `MenuDetailView`, which owns category cards, ordering, and share.
 * Kept as a thin wrapper for any leftover imports.
 */
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
  return (
    <WhatsappShareDialog
      className={className}
      title="Share categories via WhatsApp"
      description="Sends the menu categories so the manager can arrange stalls at the venue."
      variant={variant}
      buttonLabel="Share categories on WhatsApp"
      buttonClassName={buttonClassName}
      ariaLabel={`Share categories from ${menu.name}`}
      buildMessage={() =>
        buildCategoryStallShareText({
          menuName: menu.name,
          categories: menu.categories.map((category) => ({
            name: category.name,
            dishes: category.dishes.map((dish) => ({ name: dish.name })),
          })),
        })
      }
    />
  );
}
