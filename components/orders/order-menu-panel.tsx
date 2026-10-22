"use client";

import { Check, Search, UtensilsCrossed, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { CategoryWithDishes, MenuSummary } from "@/app/menus/actions";

type OrderMenuPanelProps = {
  menus: MenuSummary[];
  catalog: CategoryWithDishes[];
  selectedMenuId: number | null;
  selectedDishIds: number[];
  onMenuChange: (menuId: number | null) => void;
  onDishChange: (dishIds: number[]) => void;
};

export function OrderMenuPanel({
  menus,
  catalog,
  selectedMenuId,
  selectedDishIds,
  onMenuChange,
  onDishChange,
}: OrderMenuPanelProps) {
  const [query, setQuery] = useState("");
  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) ?? null;
  const selectedSet = useMemo(() => new Set(selectedDishIds), [selectedDishIds]);
  const categories = useMemo(() => {
    if (!selectedMenu) return [];
    const allowedCategoryIds = new Set(selectedMenu.categoryIds);
    const normalized = query.trim().toLowerCase();
    return catalog
      .filter((category) => allowedCategoryIds.has(category.id))
      .map((category) => ({
        ...category,
        dishes: normalized
          ? category.dishes.filter((dish) => dish.name.toLowerCase().includes(normalized))
          : category.dishes,
      }))
      .filter((category) => !normalized || category.dishes.length > 0);
  }, [catalog, query, selectedMenu]);

  function toggleDish(dishId: number) {
    const next = new Set(selectedSet);
    if (next.has(dishId)) next.delete(dishId);
    else next.add(dishId);
    onDishChange([...next]);
  }

  function toggleCategory(dishIds: number[]) {
    const next = new Set(selectedSet);
    const allSelected = dishIds.length > 0 && dishIds.every((dishId) => next.has(dishId));
    for (const dishId of dishIds) {
      if (allSelected) next.delete(dishId);
      else next.add(dishId);
    }
    onDishChange([...next]);
  }

  if (menus.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-6 py-10">
        <div className="max-w-sm text-center">
          <UtensilsCrossed className="mx-auto size-8 text-muted" strokeWidth={1.5} aria-hidden />
          <h2 className="mt-3 text-base font-semibold text-foreground">No menus available</h2>
          <p className="mt-1 text-sm text-muted">Create a menu in the Menu module first, or create this order without one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="shrink-0 rounded-xl border border-border bg-background p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(14rem,22rem)_minmax(0,1fr)] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Menu (optional)</span>
            <select
              value={selectedMenuId ?? ""}
              onChange={(event) => {
                const menuId = event.target.value ? Number(event.target.value) : null;
                setQuery("");
                onMenuChange(menuId);
              }}
              className="min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
            >
              <option value="">No menu</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>{menu.name}</option>
              ))}
            </select>
          </label>

          {selectedMenu ? (
            <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-primary-soft/45 px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">{selectedMenu.name}</span>
                <span className="block text-xs text-muted">{selectedMenu.categoryCount} categories · {selectedMenu.dishCount} available dishes</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{selectedDishIds.length} selected</span>
            </div>
          ) : (
            <p className="flex min-h-12 items-center text-sm text-muted">Choose a menu to see its categories and dishes.</p>
          )}
        </div>
      </div>

      {selectedMenu ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
          <div className="flex shrink-0 items-center gap-2 border-b border-border p-2.5 sm:p-3">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search dishes</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dishes"
                className="min-h-12 w-full rounded-lg border border-border bg-background py-2.5 pr-11 pl-11 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground" aria-label="Clear dish search">
                  <X className="size-5" aria-hidden />
                </button>
              ) : null}
            </label>
            {selectedDishIds.length > 0 ? (
              <button type="button" onClick={() => onDishChange([])} className="inline-flex min-h-12 shrink-0 items-center rounded-lg border border-border px-3.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground">
                Clear all
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3">
            {categories.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No dishes match “{query.trim()}”.</p>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => {
                  const categoryDishIds = category.dishes.map((dish) => dish.id);
                  const selectedCount = categoryDishIds.filter((dishId) => selectedSet.has(dishId)).length;
                  const allSelected = categoryDishIds.length > 0 && selectedCount === categoryDishIds.length;
                  return (
                    <section key={category.id} className="rounded-xl border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-foreground">{category.name}</h3>
                          <p className="text-xs text-muted">{category.selectionRule} · {selectedCount} of {category.dishes.length} selected</p>
                        </div>
                        <button type="button" onClick={() => toggleCategory(categoryDishIds)} className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface">
                          {allSelected ? "Clear category" : "Select all"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {category.dishes.map((dish) => {
                          const selected = selectedSet.has(dish.id);
                          return (
                            <button
                              key={dish.id}
                              type="button"
                              role="checkbox"
                              aria-checked={selected}
                              onClick={() => toggleDish(dish.id)}
                              className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary-soft/60 text-foreground" : "border-border bg-background text-foreground hover:border-primary/35 hover:bg-surface"}`}
                            >
                              <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent"}`}>
                                <Check className="size-4" strokeWidth={2.5} aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1 text-sm font-medium">{dish.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-surface/30 px-6 py-10">
          <div className="max-w-sm text-center">
            <UtensilsCrossed className="mx-auto size-8 text-muted" strokeWidth={1.5} aria-hidden />
            <p className="mt-3 text-sm text-muted">Menu selection is optional. Choose one above, or create the order without a menu.</p>
          </div>
        </div>
      )}
    </div>
  );
}
