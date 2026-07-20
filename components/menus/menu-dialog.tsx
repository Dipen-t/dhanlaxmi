"use client";

import { useEffect, useId, useState, useTransition } from "react";
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

  const isEditing = menu !== null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setFormKey((key) => key + 1);
    setError(null);
    setSelectedCategoryIds(menu?.categoryIds ?? catalog.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening / menu changes
  }, [open, menu?.id]);

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

  function toggleCategory(id: number) {
    setSelectedCategoryIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function selectAll() {
    setSelectedCategoryIds(catalog.map((category) => category.id));
  }

  function clearAll() {
    setSelectedCategoryIds([]);
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

    if (selectedCategoryIds.length === 0) {
      setError("Select at least one category.");
      return;
    }

    selectedCategoryIds.forEach((id) => {
      formData.append("categoryIds", String(id));
    });

    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateMenu(formData)
          : await createMenu(formData);

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

              <fieldset>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">
                    {selectedCategoryIds.length} of {catalog.length} selected
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

                        return (
                          <div
                            key={category.id}
                            className={`flex flex-col gap-1.5 px-3 py-2 text-sm border-b sm:border-r border-border/40 hover:bg-surface/50 ${
                              checked ? "bg-primary-soft/20 font-medium" : "text-foreground"
                            }`}
                          >
                            <label className="flex cursor-pointer items-center gap-2 w-full min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCategory(category.id)}
                                className="size-3.5 rounded-sm border-border text-primary accent-primary shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate leading-tight text-sm font-semibold">{category.name}</span>
                                <span className="truncate text-xs text-muted font-normal mt-0.5">
                                  {category.selectionRule} · {category.dishes.length} dishes
                                </span>
                              </div>
                            </label>
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
