"use client";

import type { MenuSummary } from "@/app/menus/actions";

import { MenuActions, MenuStats } from "./menu-actions";

type MenuGridProps = {
  menus: MenuSummary[];
  onEdit: (menu: MenuSummary) => void;
  onView: (menu: MenuSummary) => void;
};

export function MenuGrid({ menus, onEdit, onView }: MenuGridProps) {
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
            <MenuStats
              categoryCount={menu.categoryCount}
              dishCount={menu.dishCount}
            />
          </button>
          <div className="border-t border-border p-3">
            <MenuActions menu={menu} onEdit={onEdit} layout="stacked" />
          </div>
        </li>
      ))}
    </ul>
  );
}
