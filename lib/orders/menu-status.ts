/**
 * Menu-pending rule
 * -----------------
 * An order is "menu pending" when the customer has not finished selecting a
 * menu — i.e. vendors have not been given dish selections yet.
 *
 * Exact condition: zero selected dishes on the order.
 * Prefer `menuDishes.length === 0`; fall back to `dishIds.length === 0` when
 * only ids are present (same underlying `order_menu_dishes` rows).
 *
 * Intentionally NOT used as signals:
 * - `menuId` / `menuName` — template linkage is unused on the write path
 * - kitchen menus — separate catalog, not order-linked
 * - vendor WhatsApp notify — materials-only, no persisted completion flag
 */

export type MenuPendingSource = {
  menuDishes?: readonly unknown[] | null;
  dishIds?: readonly unknown[] | null;
};

export function isMenuPending(order: MenuPendingSource): boolean {
  if (order.menuDishes != null) return order.menuDishes.length === 0;
  if (order.dishIds != null) return order.dishIds.length === 0;
  return true;
}
