"use client";

import type { KitchenMenuSummary } from "@/app/kitchen-menus/actions";

import { KitchenMenuActions, KitchenMenuStats } from "./kitchen-menu-actions";

type KitchenMenuListProps = {
  menus: KitchenMenuSummary[];
  onEdit: (menu: KitchenMenuSummary) => void;
  onView: (menu: KitchenMenuSummary) => void;
};

export function KitchenMenuList({ menus, onEdit, onView }: KitchenMenuListProps) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {menus.map((menu) => (
        <li key={menu.id}>
          <div className="flex items-stretch gap-2 p-2 sm:gap-3 sm:p-2.5">
            <button
              type="button"
              onClick={() => onView(menu)}
              className="flex min-h-16 min-w-0 flex-1 touch-manipulation flex-col items-stretch justify-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface active:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
            >
              <div className="min-w-0">
                <p className="text-base font-semibold tracking-[-0.01em] text-foreground md:text-lg">
                  {menu.name}
                </p>
              </div>
              <KitchenMenuStats
                dishCount={menu.dishCount}
                deliveryTime={menu.deliveryTime}
              />
            </button>

            <div className="flex shrink-0 items-center pr-1">
              <KitchenMenuActions menu={menu} onEdit={onEdit} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
