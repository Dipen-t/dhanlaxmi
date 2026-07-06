"use client";

import { useEffect, useRef, useState, useTransition } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const isEditing = menu !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setError(null);
      setSelectedCategoryIds(menu?.categoryIds ?? catalog.map((c) => c.id));
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, menu, catalog]);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    selectedCategoryIds.forEach((id) => {
      formData.append("categoryIds", String(id));
    });

    startTransition(async () => {
      const result = isEditing
        ? await updateMenu(formData)
        : await createMenu(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      handleClose();
    });
  }

  return (
    <dialog ref={dialogRef} onClose={handleClose} className="app-dialog app-dialog-wide">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="app-dialog-body min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Edit menu" : "Create menu"}
          </h2>
          {isEditing ? <input type="hidden" name="id" value={menu.id} /> : null}

          <div className="mt-4 space-y-4">
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
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. Wedding Lunch Menu"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-foreground">
                Categories
              </legend>
              <p className="mt-1 text-xs text-muted [text-wrap:pretty]">
                Select the dish categories to include. Clients will tick dishes
                within each category when you share this menu.
              </p>
              <div className="mt-3 max-h-96 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
                {catalog.map((category) => {
                  const checked = selectedCategoryIds.includes(category.id);

                  return (
                    <div
                      key={category.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        checked ? "border-primary/40 bg-primary-soft/40" : "border-border"
                      }`}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(category.id)}
                          className="mt-1 size-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">
                            {category.name}
                          </span>
                          <span className="mt-0.5 inline-flex rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                            {category.selectionRule}
                          </span>
                          <span className="mt-2 block text-xs text-muted">
                            {category.dishes.length} dishes
                          </span>
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          </div>

          {error ? (
            <p role="alert" className="mt-3 text-sm text-primary">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {isPending ? "Saving…" : isEditing ? "Save changes" : "Create menu"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
