"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  createKitchenMenu,
  updateKitchenMenu,
  type KitchenMenuSummary,
} from "@/app/kitchen-menus/actions";
import type { CategoryWithDishes } from "@/app/menus/actions";

type KitchenMenuDialogProps = {
  open: boolean;
  menu: KitchenMenuSummary | null;
  catalog: CategoryWithDishes[];
  onClose: () => void;
};

export function KitchenMenuDialog({ open, menu, catalog, onClose }: KitchenMenuDialogProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [selectedDishIds, setSelectedDishIds] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const isEditing = menu !== null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setFormKey((key) => key + 1);
    setError(null);
    setSelectedDishIds(new Set(menu?.dishIds ?? []));
    // Expand categories that have selected dishes when editing, or first category if creating
    if (menu?.dishIds && menu.dishIds.length > 0) {
      const categoriesToExpand = new Set<number>();
      for (const category of catalog) {
        if (category.dishes.some((dish) => menu.dishIds.includes(dish.id))) {
          categoriesToExpand.add(category.id);
        }
      }
      setExpandedCategories(categoriesToExpand);
    } else if (catalog.length > 0) {
      setExpandedCategories(new Set([catalog[0].id]));
    } else {
      setExpandedCategories(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening / menu changes
  }, [open, menu?.id, catalog]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // Intentionally only when open toggles; latest onClose is fine for Escape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setError(null);
    onClose();
  }

  function toggleDish(id: number) {
    setSelectedDishIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleCategoryExpansion(id: number) {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllInCategory(category: CategoryWithDishes) {
    setSelectedDishIds((current) => {
      const next = new Set(current);
      const allSelected = category.dishes.every((d) => next.has(d.id));
      for (const dish of category.dishes) {
        if (allSelected) {
          next.delete(dish.id);
        } else {
          next.add(dish.id);
        }
      }
      return next;
    });
  }

  function clearAll() {
    setSelectedDishIds(new Set());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setError("Menu name is required.");
      return;
    }

    if (selectedDishIds.size === 0) {
      setError("Select at least one dish.");
      return;
    }

    selectedDishIds.forEach((id) => {
      formData.append("dishIds", String(id));
    });

    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateKitchenMenu(formData)
          : await createKitchenMenu(formData);

        if (result.error) {
          setError(result.error);
          return;
        }

        handleClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[oklch(0.22_0.02_175/0.45)]"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(100dvh,44rem)] w-full max-w-[42rem] flex-col overflow-hidden rounded-t-2xl border border-border bg-background text-foreground shadow-none sm:rounded-xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          maxHeight:
            "min(100dvh - env(safe-area-inset-top, 0px), 44rem)",
        }}
      >
        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-4 [-webkit-overflow-scrolling:touch] sm:px-6">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-[-0.02em] text-foreground"
            >
              {isEditing ? "Edit kitchen menu" : "Create kitchen menu"}
            </h2>
            <p className="mt-1 text-sm text-muted text-pretty">
              Name the menu, then pick which individual dishes to include in the kitchen PDF.
            </p>
            {isEditing ? <input type="hidden" name="id" value={menu.id} /> : null}

            <div className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="menu-name"
                  className="block text-sm font-medium text-foreground"
                >
                  Menu name
                </label>
                <input
                  id="menu-name"
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  defaultValue={menu?.name ?? ""}
                  autoComplete="off"
                  enterKeyHint="done"
                  className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                  placeholder="e.g. Wedding Lunch Kitchen Menu"
                />
              </div>

              <fieldset>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <legend className="block text-sm font-medium text-foreground">
                      Dishes
                    </legend>
                    <p className="mt-1 text-sm text-muted text-pretty">
                      {selectedDishIds.size} dishes selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex min-h-10 touch-manipulation items-center rounded-lg border border-border px-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="mt-3 max-h-[min(22rem,42dvh)] space-y-3 overflow-y-auto overscroll-contain rounded-xl border border-border p-3 [-webkit-overflow-scrolling:touch]">
                  {catalog.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted">
                      No categories in the catalog yet.
                    </p>
                  ) : (
                    catalog.map((category) => {
                      const selectedCount = category.dishes.filter((d) => selectedDishIds.has(d.id)).length;
                      const allSelected = selectedCount === category.dishes.length && category.dishes.length > 0;
                      const isExpanded = expandedCategories.has(category.id);

                      return (
                        <div key={category.id} className="rounded-lg border border-border overflow-hidden">
                          <div className="flex items-center justify-between bg-surface/50 px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpansion(category.id)}
                              className="flex flex-1 items-center gap-2 text-left"
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-4 text-muted" />
                              ) : (
                                <ChevronRight className="size-4 text-muted" />
                              )}
                              <span className="font-semibold text-foreground text-sm">
                                {category.name}
                              </span>
                              <span className="text-xs text-muted">
                                ({selectedCount}/{category.dishes.length})
                              </span>
                            </button>
                            {category.dishes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleAllInCategory(category)}
                                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                              >
                                {allSelected ? "Deselect All" : "Select All"}
                              </button>
                            )}
                          </div>
                          
                          {isExpanded && (
                            <div className="divide-y divide-border/50 border-t border-border">
                              {category.dishes.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-muted italic">No dishes in this category.</p>
                              ) : (
                                category.dishes.map((dish) => {
                                  const checked = selectedDishIds.has(dish.id);
                                  return (
                                    <label
                                      key={dish.id}
                                      className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface/50 ${
                                        checked ? "bg-primary-soft/10" : ""
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleDish(dish.id)}
                                        className="size-4 rounded border-border text-primary accent-primary focus:ring-ring"
                                      />
                                      <span className="text-sm text-foreground">{dish.name}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </fieldset>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm font-medium text-red-600">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 touch-manipulation items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isPending
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Create menu"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
