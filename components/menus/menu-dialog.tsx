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
              {isEditing ? "Edit menu" : "Create menu"}
            </h2>
            <p className="mt-1 text-sm text-muted text-pretty">
              Name the menu, then pick which dish categories to include.
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
                  placeholder="e.g. Wedding Lunch Menu"
                />
              </div>

              <fieldset>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <legend className="block text-sm font-medium text-foreground">
                      Categories
                    </legend>
                    <p className="mt-1 text-sm text-muted text-pretty">
                      {selectedCategoryIds.length} of {catalog.length} selected
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="inline-flex min-h-10 touch-manipulation items-center rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex min-h-10 touch-manipulation items-center rounded-lg border border-border px-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-3 max-h-[min(22rem,42dvh)] space-y-2 overflow-y-auto overscroll-contain rounded-xl border border-border p-2 [-webkit-overflow-scrolling:touch]">
                  {catalog.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted">
                      No categories in the catalog yet.
                    </p>
                  ) : (
                    catalog.map((category) => {
                      const checked = selectedCategoryIds.includes(category.id);

                      return (
                        <label
                          key={category.id}
                          className={`flex min-h-14 cursor-pointer touch-manipulation items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                            checked
                              ? "border-primary/40 bg-primary-soft/40"
                              : "border-transparent hover:bg-surface"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCategory(category.id)}
                            className="size-5 shrink-0 rounded border-border text-primary accent-primary focus:ring-ring"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-base font-semibold text-foreground">
                              {category.name}
                            </span>
                            <span className="mt-0.5 block text-sm text-muted">
                              {category.selectionRule} · {category.dishes.length}{" "}
                              dishes
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </fieldset>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm font-medium text-error">
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
