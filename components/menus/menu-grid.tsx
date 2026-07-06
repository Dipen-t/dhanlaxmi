import type { MenuSummary } from "@/app/menus/actions";

import { MenuActions, MenuStats } from "./menu-actions";

type MenuGridProps = {
  menus: MenuSummary[];
  onEdit: (menu: MenuSummary) => void;
};

export function MenuGrid({ menus, onEdit }: MenuGridProps) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {menus.map((menu) => (
        <li
          key={menu.id}
          className="flex flex-col rounded-xl border border-border bg-background p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground [text-wrap:pretty]">
              {menu.name}
            </p>
            <div className="mt-3">
              <MenuStats
                categoryCount={menu.categoryCount}
                dishCount={menu.dishCount}
              />
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <MenuActions menu={menu} onEdit={onEdit} layout="stacked" />
          </div>
        </li>
      ))}
    </ul>
  );
}
