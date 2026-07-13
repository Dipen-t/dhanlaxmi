"use client";

import type { MenuSummary } from "@/app/menus/actions";

import { MenuActions, MenuStats } from "./menu-actions";

type MenuListProps = {
  menus: MenuSummary[];
  onEdit: (menu: MenuSummary) => void;
  onView: (menu: MenuSummary) => void;
};

export function MenuList({ menus, onEdit, onView }: MenuListProps) {
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
              <MenuStats
                categoryCount={menu.categoryCount}
                dishCount={menu.dishCount}
              />
            </button>

            <div className="flex shrink-0 items-center pr-1">
              <MenuActions menu={menu} onEdit={onEdit} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
