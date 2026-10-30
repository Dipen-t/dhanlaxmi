"use client";

import type { KitchenMenuSummary } from "@/app/kitchen-menus/actions";

import { KitchenMenuActions, KitchenMenuStats } from "./kitchen-menu-actions";

type KitchenMenuGridProps = {
  menus: KitchenMenuSummary[];
  onEdit: (menu: KitchenMenuSummary) => void;
  onView: (menu: KitchenMenuSummary) => void;
};

export function KitchenMenuGrid({ menus, onEdit, onView }: KitchenMenuGridProps) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3">
      {menus.map((menu) => (
        <li
          key={menu.id}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-background"
        >
          <button
            type="button"
            onClick={() => onView(menu)}
            className="flex min-h-28 flex-1 touch-manipulation flex-col items-start gap-3 p-4 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <p className="text-base font-semibold tracking-[-0.01em] text-foreground text-pretty md:text-lg">
              {menu.name}
            </p>
            <KitchenMenuStats
              dishCount={menu.dishCount}
              deliveryTime={menu.deliveryTime}
            />
          </button>
          <div className="border-t border-border p-3">
            <KitchenMenuActions menu={menu} onEdit={onEdit} layout="stacked" />
          </div>
        </li>
      ))}
    </ul>
  );
}
