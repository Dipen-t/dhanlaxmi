"use client";

import {
  shareKitchenMenuViaWhatsApp,
  type KitchenMenuDetail,
  type KitchenMenuSummary,
} from "@/app/kitchen-menus/actions";
import { WhatsappShareDialog } from "@/components/whatsapp/whatsapp-share-dialog";
import { buildKitchenMenuShareText } from "@/lib/whatsapp-share";

type KitchenMenuWhatsappShareProps = {
  menu: KitchenMenuSummary | KitchenMenuDetail;
  categories?: KitchenMenuDetail["categories"];
  variant?: "icon" | "button";
  className?: string;
  buttonClassName?: string;
};

function formatMenuDate(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function KitchenMenuWhatsappShare({
  menu,
  categories = [],
  variant = "icon",
  className = "",
  buttonClassName,
}: KitchenMenuWhatsappShareProps) {
  return (
    <WhatsappShareDialog
      title="Share kitchen menu"
      description="Opens WhatsApp with the kitchen menu text. Optionally send the PDF via API when WhatsApp is configured."
      variant={variant}
      buttonLabel="Share via WhatsApp"
      className={className}
      buttonClassName={buttonClassName}
      ariaLabel={`Share ${menu.name} via WhatsApp`}
      buildMessage={() =>
        buildKitchenMenuShareText({
          name: menu.name,
          venue: "venue" in menu ? menu.venue : null,
          dateLabel: formatMenuDate("date" in menu ? menu.date : null),
          numberOfPersons: "numberOfPersons" in menu ? menu.numberOfPersons : null,
          mealType: "mealType" in menu ? menu.mealType : null,
          categories: categories.map((c) => ({
            name: c.name,
            dishes: c.dishes.map((d) => ({ name: d.name, quantity: d.quantity })),
          })),
        })
      }
      onServerSend={(phone, text) => shareKitchenMenuViaWhatsApp(menu.id, phone, text)}
    />
  );
}
