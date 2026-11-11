import type { KitchenMenuDetail } from "@/app/kitchen-menus/actions";
import type { PdfLogoAssets } from "@/lib/menus/prepare-pdf-logo";
import { registerPdfFonts } from "@/lib/menus/register-pdf-fonts";

import { renderToBuffer } from "@react-pdf/renderer";
import { KitchenMenuPdfDocument } from "@/lib/menus/kitchen-menu-pdf-document";
import { menuPdfThemes } from "@/lib/menus/pdf-themes";
import { formatDeliveryTime } from "@/lib/kitchen-menus/delivery-time";

export async function generateKitchenMenuPdfBuffer(
  menu: KitchenMenuDetail,
  logo: PdfLogoAssets,
  theme = "standard",
): Promise<Buffer> {
  if (!menuPdfThemes.some((item) => item.id === theme)) throw new Error("Select a valid PDF design.");
  if (theme !== "standard") {
    const { generateMenuPdfBuffer } = await import("@/lib/menus/generate-menu-pdf");
    const fields = [
      menu.venue ? `Venue: ${menu.venue}` : null,
      menu.date ? `Date: ${new Date(menu.date).toLocaleDateString("en-IN")}` : null,
      menu.numberOfPersons ? `Persons: ${menu.numberOfPersons}` : null,
      menu.mealType ? `Meal: ${menu.mealType}` : null,
      menu.deliveryTime ? `Deliver by: ${formatDeliveryTime(menu.deliveryTime)}` : null,
    ].filter((field): field is string => Boolean(field));
    return generateMenuPdfBuffer({
      id: menu.id,
      name: menu.name,
      categories: [
        ...(fields.length ? [{ id: -1, name: "Kitchen event details", selectionRule: "", dishes: fields.map((name, index) => ({ id: -index - 1, name })) }] : []),
        ...menu.categories.map((category) => ({
          id: category.id,
          name: category.name,
          selectionRule: category.selectionRule,
          dishes: category.dishes.map((dish) => ({ id: dish.id, name: dish.quantity ? `${dish.name} - ${dish.quantity}` : dish.name })),
        })),
      ],
    }, logo, theme);
  }
  registerPdfFonts();

  const buffer = await renderToBuffer(
    <KitchenMenuPdfDocument menu={menu} logo={logo} />,
  );

  return Buffer.from(buffer);
}
