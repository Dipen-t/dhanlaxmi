"use client";

import { Check, Search, UtensilsCrossed, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { CategoryWithDishes } from "@/app/menus/actions";
import { searchDishCatalog } from "@/lib/orders/dish-search";
import { HI_TEA_NOTES_LIMIT, isHiTeaCategory } from "@/lib/orders/hi-tea";

type Props = {
  catalog: CategoryWithDishes[];
  selectedDishIds: number[];
  onDishChange: (dishIds: number[]) => void;
  hiTeaNotes: string;
  onHiTeaNotesChange: (notes: string) => void;
};

export function OrderDishesPanel({ catalog, selectedDishIds, onDishChange, hiTeaNotes, onHiTeaNotesChange }: Props) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selectedDishIds), [selectedDishIds]);
  const categories = useMemo(() => searchDishCatalog(catalog, query), [catalog, query]);
  const matchingDishCount = categories.reduce((total, category) => total + category.dishes.length, 0);

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
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border p-2.5 sm:p-3">
        <label className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <span className="sr-only">Search dishes or categories</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" strokeWidth={1.75} aria-hidden />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes or categories" className="min-h-12 w-full rounded-lg border border-border bg-background py-2.5 pr-11 pl-11 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30" />
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

      {query.trim() ? <p role="status" className="shrink-0 px-3 py-2 text-sm text-muted">{matchingDishCount} dishes in {categories.length} categories</p> : null}

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
                      <h3 className="text-base font-semibold text-pretty text-foreground">{category.name}</h3>
                      {category.selectionRule ? <p className="mt-1 text-xs text-muted">{category.selectionRule}</p> : null}
                      <p className="text-xs text-muted">{selectedCount} of {category.dishes.length} selected</p>
                    </div>
                    <button type="button" disabled={dishIds.length === 0} onClick={() => toggleCategory(dishIds)} className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface disabled:cursor-default disabled:opacity-40">{query.trim() ? (allSelected ? "Clear matches" : "Select matches") : (allSelected ? "Clear category" : "Select all")}</button>
                  </div>
                  {isHiTeaCategory(category.name) ? (
                    <label className="mb-3 block space-y-1.5">
                      <span className="text-sm font-medium text-foreground">Hi-tea notes <span className="font-normal text-muted">(optional)</span></span>
                      <textarea value={hiTeaNotes} onChange={event => onHiTeaNotesChange(event.target.value)} rows={3} maxLength={HI_TEA_NOTES_LIMIT} placeholder="Add Hi-tea details or special instructions…" className="min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30" />
                    </label>
                  ) : null}
                  {category.dishes.length === 0 ? <p className="py-2 text-sm text-muted">No dishes added to this section yet.</p> : null}
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
