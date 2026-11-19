"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import {
  createMenu,
  updateMenu,
  type CategoryWithDishes,
  type MenuSummary,
} from "@/app/menus/actions";

type MenuDialogProps = {
  open: boolean;
  menu: MenuSummary | null;
  catalog: CategoryWithDishes[];
  onClose: () => void;
};

export function MenuDialog({ open, menu, catalog, onClose }: MenuDialogProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedDishIds, setSelectedDishIds] = useState<number[]>([]);
  const savingRef = useRef(false);

  const isEditing = menu !== null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mount the portal after hydration.
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialize a newly opened create/edit session.
    setFormKey((key) => key + 1);
    setError(null);
    setSelectedCategoryIds(menu?.categoryIds ?? catalog.map((c) => c.id));
    setSelectedDishIds(menu?.dishIds ?? catalog.flatMap((category) => category.dishes.map((dish) => dish.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening / menu changes
  }, [open, menu?.id]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (!savingRef.current) onClose();
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
    if (savingRef.current) return;
    setError(null);
    onClose();
  }

  function toggleCategory(id: number) {
    const dishes = catalog.find((category) => category.id === id)?.dishes ?? [];
    const dishIds = dishes.map((dish) => dish.id);
    const removing = selectedCategoryIds.includes(id);
    setSelectedDishIds((current) => removing ? current.filter((dishId) => !dishIds.includes(dishId)) : [...new Set([...current, ...dishIds])]);
    setSelectedCategoryIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function selectAll() {
    setSelectedCategoryIds(catalog.map((category) => category.id));
    setSelectedDishIds(catalog.flatMap((category) => category.dishes.map((dish) => dish.id)));
  }

  function clearAll() {
    setSelectedCategoryIds([]);
    setSelectedDishIds([]);
  }

  function toggleDish(category: CategoryWithDishes, dishId: number) {
    const next = selectedDishIds.includes(dishId) ? selectedDishIds.filter((id) => id !== dishId) : [...selectedDishIds, dishId];
    setSelectedDishIds(next);
    setSelectedCategoryIds((current) => category.dishes.some((dish) => next.includes(dish.id)) ? [...new Set([...current, category.id])] : current.filter((id) => id !== category.id));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (savingRef.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setError("Menu name is required.");
      return;
    }

    if (selectedCategoryIds.length === 0) {
      setError("Select at least one category.");
      return;
    }

    selectedCategoryIds.forEach((id) => {
      formData.append("categoryIds", String(id));
    });
    formData.set("dishSelection", "custom");
    selectedDishIds.forEach((id) => formData.append("dishIds", String(id)));

    savingRef.current = true;
    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateMenu(formData)
          : await createMenu(formData);

        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }

        savingRef.current = false;
        handleClose();
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        savingRef.current = false;
      }
    });
  }

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
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
        className="relative z-10 flex max-h-[min(100dvh,72rem)] w-full max-w-[72rem] flex-col overflow-hidden rounded-t-2xl border border-border bg-background text-foreground shadow-none sm:rounded-xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          maxHeight:
            "min(100dvh - env(safe-area-inset-top, 0px), 72rem)",
        }}
      >
        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-2 [-webkit-overflow-scrolling:touch] sm:px-4">
            <h2
              id={titleId}
              className="text-lg font-semibold text-foreground"
            >
              {isEditing ? "Edit menu" : "Create menu"}
            </h2>
            {isEditing ? <input type="hidden" name="id" value={menu.id} /> : null}

            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <input
                  id="menu-name"
                  name="name"
                  aria-label="Menu name"
                  type="text"
                  required
                  maxLength={120}
                  defaultValue={menu?.name ?? ""}
                  autoComplete="off"
                  enterKeyHint="done"
                  className="min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-ring/30"
                  placeholder="Menu name"
                />
              </div>

              <fieldset disabled={isPending}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">
                    {selectedCategoryIds.length} categories · {selectedDishIds.length} dishes selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs font-medium text-primary hover:text-primary/80"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs font-medium text-muted hover:text-foreground"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 max-h-[min(45rem,75dvh)] space-y-1 overflow-y-auto overscroll-contain rounded-md border border-border p-1 [-webkit-overflow-scrolling:touch]">
                  {catalog.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted">
                      No categories in the catalog yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 border border-border rounded overflow-hidden">
                      {catalog.map((category) => {
                        const checked = selectedCategoryIds.includes(category.id);
                        const dishCount = category.dishes.filter((dish) => selectedDishIds.includes(dish.id)).length;

                        return (
                          <div
                            key={category.id}
                            className={`flex flex-col gap-1.5 px-3 py-2 text-sm border-b sm:border-r border-border/40 hover:bg-surface/50 ${
                              checked ? "bg-primary-soft/20 font-medium" : "text-foreground"
                            }`}
                          >
                            <label className="flex min-h-11 cursor-pointer items-center gap-2 w-full min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                ref={(input) => { if (input) input.indeterminate = checked && dishCount > 0 && dishCount < category.dishes.length; }}
                                onChange={() => toggleCategory(category.id)}
                                className="size-3.5 rounded-sm border-border text-primary accent-primary shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate leading-tight text-sm font-semibold">{category.name}</span>
                                <span className="truncate text-xs text-muted font-normal mt-0.5">
                                  {category.selectionRule} · {dishCount}/{category.dishes.length} dishes
                                </span>
                              </div>
                            </label>
                            {category.dishes.length > 0 ? (
                              <details className="font-normal">
                                <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Choose dishes</summary>
                                <div className="border-t border-border/40">
                                  {category.dishes.map((dish) => (
                                    <label key={dish.id} className="flex min-h-11 cursor-pointer items-center gap-2 py-2 text-sm">
                                      <input type="checkbox" checked={selectedDishIds.includes(dish.id)} onChange={() => toggleDish(category, dish.id)} className="size-4 shrink-0 accent-primary" />
                                      <span className="min-w-0 break-words">{dish.name}</span>
                                    </label>
                                  ))}
                                </div>
                              </details>
                            ) : <p className="text-xs font-normal text-muted">No dishes in this category yet.</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </fieldset>
            </div>
            {error ? (
              <p role="alert" className="mt-2 text-xs font-medium text-error">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-3 py-2 sm:px-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="inline-flex min-h-9 touch-manipulation items-center rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-9 touch-manipulation items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
