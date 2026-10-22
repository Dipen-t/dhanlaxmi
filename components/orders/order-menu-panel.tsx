"use client";

import { Check, Search, UtensilsCrossed, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { CategoryWithDishes } from "@/app/menus/actions";

type Props = {
  catalog: CategoryWithDishes[];
  selectedDishIds: number[];
  onDishChange: (dishIds: number[]) => void;
};

export function OrderDishesPanel({ catalog, selectedDishIds, onDishChange }: Props) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selectedDishIds), [selectedDishIds]);
  const categories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalog
      .map((category) => ({
        ...category,
        dishes: normalized ? category.dishes.filter((dish) => dish.name.toLowerCase().includes(normalized)) : category.dishes,
      }))
      .filter((category) => !normalized || category.dishes.length > 0);
  }, [catalog, query]);

  function toggleDish(dishId: number) {
    const next = new Set(selectedSet);
    if (next.has(dishId)) next.delete(dishId);
    else next.add(dishId);
    onDishChange([...next]);
  }

  function toggleCategory(dishIds: number[]) {
    const next = new Set(selectedSet);
    const allSelected = dishIds.length > 0 && dishIds.every((dishId) => next.has(dishId));
    for (const dishId of dishIds) allSelected ? next.delete(dishId) : next.add(dishId);
    onDishChange([...next]);
  }

  if (catalog.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-6 py-10">
        <div className="max-w-sm text-center">
          <UtensilsCrossed className="mx-auto size-8 text-muted" strokeWidth={1.5} aria-hidden />
          <h2 className="mt-3 text-base font-semibold text-foreground">No categories or dishes available</h2>
          <p className="mt-1 text-sm text-muted">Add them in the Menu catalog first, or create this order without dishes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b border-border p-2.5 sm:p-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search dishes</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all dishes" className="min-h-12 w-full rounded-lg border border-border bg-background py-2.5 pr-11 pl-11 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30" />
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground" aria-label="Clear dish search">
              <X className="size-5" aria-hidden />
            </button>
          ) : null}
        </label>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">{selectedDishIds.length} selected</span>
        {selectedDishIds.length > 0 ? (
          <button type="button" onClick={() => onDishChange([])} className="inline-flex min-h-12 shrink-0 items-center rounded-lg border border-border px-3.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground">Clear all</button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-3">
        {categories.length === 0 ? <p className="py-10 text-center text-sm text-muted">No dishes match “{query.trim()}”.</p> : (
          <div className="space-y-3">
            {categories.map((category) => {
              const dishIds = category.dishes.map((dish) => dish.id);
              const selectedCount = dishIds.filter((dishId) => selectedSet.has(dishId)).length;
              const allSelected = dishIds.length > 0 && selectedCount === dishIds.length;
              return (
                <section key={category.id} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-foreground">{category.name}</h3>
                      <p className="text-xs text-muted">{category.selectionRule} · {selectedCount} of {category.dishes.length} selected</p>
                    </div>
                    <button type="button" onClick={() => toggleCategory(dishIds)} className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface">{allSelected ? "Clear category" : "Select all"}</button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {category.dishes.map((dish) => {
                      const selected = selectedSet.has(dish.id);
                      return (
                        <button key={dish.id} type="button" role="checkbox" aria-checked={selected} onClick={() => toggleDish(dish.id)} className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary-soft/60 text-foreground" : "border-border bg-background text-foreground hover:border-primary/35 hover:bg-surface"}`}>
                          <span className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-transparent"}`}><Check className="size-4" strokeWidth={2.5} aria-hidden /></span>
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
  );
}
