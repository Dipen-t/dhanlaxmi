"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { KitchenCategoryWithDishes } from "@/app/kitchen-menus/actions";
import {
  deleteKitchenCategory,
  deleteKitchenDish,
  saveKitchenCategory,
  saveKitchenDish,
} from "@/app/kitchen-menus/catalog/actions";

const inputClass =
  "min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring";
const buttonClass =
  "inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50";
const primaryClass = `${buttonClass} bg-primary text-primary-foreground hover:bg-primary/90`;

type Result = { error?: string; success?: boolean; id?: number };
type Deletion = { type: "category" | "dish"; id: number; name: string };

export function KitchenCatalogManager({ catalog }: { catalog: KitchenCategoryWithDishes[] }) {
  const router = useRouter();
  const uid = useId();
  const [selectedId, setSelectedId] = useState<number | null>(catalog[0]?.id ?? null);
  const [creating, setCreating] = useState(catalog.length === 0);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [editingDish, setEditingDish] = useState<number | null>(null);
  const [deletion, setDeletion] = useState<Deletion | null>(null);

  const category = creating
    ? undefined
    : catalog.find((item) => item.id === selectedId) ?? catalog[0];
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = catalog.filter((item) =>
    `${item.name} ${item.dishes.map((dish) => dish.name).join(" ")}`
      .toLowerCase()
      .includes(normalizedSearch),
  );

  function run(action: () => Promise<Result>, successMessage: string, after?: (result: Result) => void) {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage(successMessage);
        after?.(result);
        router.refresh();
      } catch {
        setError("Could not save your changes. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error ? <p role="alert" className="rounded-lg bg-error-soft p-3 text-sm text-error">{error}</p> : null}
      {message ? <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm text-primary">{message}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-3">
          <label className="block text-sm font-medium" htmlFor={`${uid}-search`}>
            Find a category or dish
          </label>
          <input
            id={`${uid}-search`}
            type="search"
            className={inputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search kitchen catalog"
          />
          <button
            type="button"
            className={`${primaryClass} w-full`}
            disabled={pending}
            onClick={() => {
              setCreating(true);
              setEditingDish(null);
              setDeletion(null);
            }}
          >
            + Add category
          </button>
          <ul className="max-h-[65vh] space-y-1 overflow-y-auto overscroll-contain">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={pending}
                  aria-pressed={category?.id === item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    setCreating(false);
                    setEditingDish(null);
                    setDeletion(null);
                  }}
                  className={`min-h-14 w-full touch-manipulation rounded-lg border p-3 text-left transition-colors ${
                    category?.id === item.id
                      ? "border-primary bg-primary-soft"
                      : "border-transparent hover:bg-surface"
                  }`}
                >
                  <span className="block font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-muted">
                    {item.dishes.length} dish{item.dishes.length === 1 ? "" : "es"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {filtered.length === 0 ? <p className="text-sm text-muted">No categories found.</p> : null}
        </aside>

        <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {creating || !category ? "Add category" : "Edit category"}
          </h2>
          <form
            key={creating ? "new" : `${category?.id}-${category?.name}-${category?.selectionRule}-${category?.isQtyField}`}
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              run(() => saveKitchenCategory(formData), "Category saved.", (result) => {
                setSelectedId(result.id ?? null);
                setCreating(false);
              });
            }}
          >
            <fieldset disabled={pending} className="space-y-4">
              {category ? <input type="hidden" name="id" value={category.id} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-foreground">
                  Category name
                  <input className={inputClass} name="name" required maxLength={100} defaultValue={category?.name ?? ""} />
                </label>
                <label className="space-y-1 text-sm font-medium text-foreground">
                  Category note
                  <input
                    className={inputClass}
                    name="selectionRule"
                    maxLength={120}
                    defaultValue={category?.selectionRule ?? ""}
                    placeholder="Optional kitchen instruction"
                  />
                </label>
              </div>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm text-foreground">
                <input type="checkbox" name="isQtyField" defaultChecked={category?.isQtyField ?? false} className="size-4 accent-primary" />
                Ask for quantity when this category’s dishes are selected
              </label>
              <div className="flex flex-wrap gap-2">
                <button className={primaryClass}>{pending ? "Saving…" : "Save category"}</button>
                {creating ? (
                  <button type="button" className={buttonClass} onClick={() => setCreating(false)}>Cancel</button>
                ) : null}
                {category ? (
                  <button
                    type="button"
                    className={`${buttonClass} text-error`}
                    onClick={() => setDeletion({ type: "category", id: category.id, name: category.name })}
                  >
                    Delete category
                  </button>
                ) : null}
              </div>
            </fieldset>
          </form>

          {category ? (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="mb-3 font-semibold text-foreground">
                Dishes <span className="text-muted">({category.dishes.length})</span>
              </h3>
              <form
                className="mb-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  const element = event.currentTarget;
                  const formData = new FormData(element);
                  run(() => saveKitchenDish(formData), "Dish added.", () => element.reset());
                }}
              >
                <input type="hidden" name="categoryId" value={category.id} />
                <input name="name" aria-label="New dish name" className={`${inputClass} flex-1`} required maxLength={120} disabled={pending} placeholder="Add a dish" />
                <button className={`${primaryClass} shrink-0`} disabled={pending}>Add dish</button>
              </form>

              <ul className="divide-y divide-border">
                {category.dishes.map((dish) => (
                  <li key={dish.id} className="py-3">
                    {editingDish === dish.id ? (
                      <form
                        className="flex flex-col gap-2 sm:flex-row"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          run(() => saveKitchenDish(formData), "Dish saved.", () => setEditingDish(null));
                        }}
                      >
                        <input type="hidden" name="id" value={dish.id} />
                        <input type="hidden" name="categoryId" value={category.id} />
                        <input aria-label="Edit dish name" name="name" className={`${inputClass} flex-1`} defaultValue={dish.name} maxLength={120} required disabled={pending} autoFocus />
                        <button className={primaryClass} disabled={pending}>Save</button>
                        <button type="button" className={buttonClass} disabled={pending} onClick={() => setEditingDish(null)}>Cancel</button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 break-words text-sm text-foreground">{dish.name}</span>
                        <div className="flex shrink-0 gap-2">
                          <button type="button" className={buttonClass} disabled={pending} onClick={() => setEditingDish(dish.id)}>Edit</button>
                          <button type="button" className={`${buttonClass} text-error`} disabled={pending} onClick={() => setDeletion({ type: "dish", id: dish.id, name: dish.name })}>Delete</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {category.dishes.length === 0 ? <p className="py-4 text-sm text-muted">No dishes yet.</p> : null}
            </div>
          ) : null}

          {deletion ? (
            <div role="alert" className="mt-5 rounded-lg border border-error/30 bg-error-soft p-4">
              <p className="text-sm text-foreground">
                Delete <strong>{deletion.name}</strong>? This also removes it from existing kitchen menus that use it.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  className={`${buttonClass} text-error`}
                  onClick={() => {
                    const formData = new FormData();
                    formData.set("id", String(deletion.id));
                    run(
                      () => deletion.type === "category" ? deleteKitchenCategory(formData) : deleteKitchenDish(formData),
                      "Deleted successfully.",
                      () => {
                        setDeletion(null);
                        setEditingDish(null);
                        if (deletion.type === "category") setSelectedId(null);
                      },
                    );
                  }}
                >
                  Confirm delete
                </button>
                <button type="button" disabled={pending} className={buttonClass} onClick={() => setDeletion(null)}>Cancel</button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
