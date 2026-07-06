import type { MenuSummary } from "@/app/menus/actions";

import { MenuActions, MenuStats } from "./menu-actions";

type MenuListProps = {
  menus: MenuSummary[];
  onEdit: (menu: MenuSummary) => void;
};

export function MenuList({ menus, onEdit }: MenuListProps) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {menus.map((menu) => (
        <li
          key={menu.id}
          className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground [text-wrap:pretty]">
              {menu.name}
            </p>
          </div>
          <MenuStats
            categoryCount={menu.categoryCount}
            dishCount={menu.dishCount}
          />
          <MenuActions menu={menu} onEdit={onEdit} />
        </li>
      ))}
    </ul>
  );
}
