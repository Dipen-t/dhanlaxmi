"use client";

import type { MenuDetail, MenuSummary } from "@/app/menus/actions";

type OrderMenuPanelProps = {
  menus: MenuSummary[];
  selectedMenu: MenuDetail | null;
  selectedDishIds: number[];
  onSelectMenu: (menuId: number | null) => void;
  onToggleDish: (dishId: number) => void;
  loadingMenu?: boolean;
};

export function OrderMenuPanel({
  menus,
  selectedMenu,
  selectedDishIds,
  onSelectMenu,
  onToggleDish,
  loadingMenu = false,
}: OrderMenuPanelProps) {
  const selected = new Set(selectedDishIds);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 rounded-xl border border-border bg-background p-4 sm:p-5">
        <label htmlFor="order-menu" className="mb-1.5 block text-sm font-medium text-foreground">
          Client menu
        </label>
        <select
          id="order-menu"
          value={selectedMenu?.id ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            onSelectMenu(value ? Number(value) : null);
          }}
          className="w-full min-h-11 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
        >
          <option value="">No menu selected</option>
          {menus.map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-muted">
          Select dishes the customer chose. They appear on the calendar under customer info.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-background">
        {!selectedMenu ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            Choose a client menu to pick dishes.
          </p>
        ) : loadingMenu ? (
          <p className="px-4 py-10 text-center text-sm text-muted">Loading menu…</p>
        ) : selectedMenu.categories.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            This menu has no categories yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {selectedMenu.categories.map((category) => (
              <section key={category.id} className="p-4 sm:p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {category.name}
                  <span className="ml-2 font-normal text-muted">{category.selectionRule}</span>
                </h3>
                <ul className="space-y-2">
                  {category.dishes.map((dish) => {
                    const checked = selected.has(dish.id);
                    return (
                      <li key={dish.id}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface has-[:checked]:border-primary/40 has-[:checked]:bg-primary-soft">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleDish(dish.id)}
                            className="size-4 accent-primary"
                          />
                          <span className="text-sm font-medium text-foreground">{dish.name}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
