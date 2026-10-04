"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CategoryWithDishes } from "@/app/menus/actions";
import { saveCategory, deleteCategory, saveDish, deleteDish } from "@/app/menus/catalog/actions";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const button = "rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50";
const primary = `${button} bg-primary text-primary-foreground hover:bg-primary/90`;
type Result = { error?: string; success?: boolean; id?: number };

export function MenuCatalogManager({ catalog }: { catalog: CategoryWithDishes[] }) {
  const router = useRouter();
  const uid = useId();
  const [selectedId, setSelectedId] = useState<number | null>(catalog[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [editingDish, setEditingDish] = useState<number | null>(null);
  const [deletion, setDeletion] = useState<{ type: "category" | "dish"; id: number; name: string } | null>(null);
  const category = creating ? undefined : catalog.find(item => item.id === selectedId) ?? catalog[0];
  const filtered = catalog.filter(item => `${item.name} ${item.dishes.map(dish => dish.name).join(" ")}`.toLowerCase().includes(search.toLowerCase()));

  function run(action: () => Promise<Result>, success: string, after?: (result: Result) => void) {
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await action();
        if (result.error) { setError(result.error); return; }
        setMessage(success); after?.(result); router.refresh();
      } catch { setError("Could not save your changes. Please try again."); }
    });
  }

  return <div className="space-y-4">
    {error && <p role="alert" className="rounded-lg bg-error-soft p-3 text-sm text-error">{error}</p>}
    <p role="status" className="text-sm text-primary">{message}</p>
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <label className="block text-sm font-medium" htmlFor={`${uid}-search`}>Find a category or dish</label>
        <input id={`${uid}-search`} type="search" className={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search catalog…" />
        <button type="button" className={`${primary} w-full`} disabled={pending} onClick={() => { setCreating(true); setEditingDish(null); setDeletion(null); }}>+ Add category</button>
        <ul className="max-h-[65vh] space-y-1 overflow-y-auto">
          {filtered.map(item => <li key={item.id}><button type="button" disabled={pending} aria-pressed={category?.id === item.id} onClick={() => { setSelectedId(item.id); setCreating(false); setEditingDish(null); setDeletion(null); }} className={`w-full rounded-lg border p-3 text-left transition-colors ${category?.id === item.id ? "border-primary bg-primary-soft" : "border-transparent hover:bg-surface"}`}>
            <span className="block font-medium">{item.name}</span><span className="text-xs text-muted">{item.selectionRule ? `${item.selectionRule} · ` : ""}{item.dishes.length} dishes</span>
          </button></li>)}
        </ul>
        {!filtered.length && <p className="text-sm text-muted">No categories found.</p>}
      </aside>
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="mb-4 text-lg font-semibold">{creating || !category ? "Add category" : "Edit category"}</h2>
        <form key={creating ? "new" : `${category?.id}-${category?.name}-${category?.selectionRule}`} onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); run(() => saveCategory(form), "Category saved.", result => { setSelectedId(result.id ?? null); setCreating(false); }); }}>
          <fieldset disabled={pending} className="space-y-4">
            {category && <input type="hidden" name="id" value={category.id} />}
            <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
              <label className="space-y-1 text-sm font-medium">Category name<input className={input} name="name" required maxLength={100} defaultValue={category?.name ?? ""} placeholder="e.g. Veg Starter" /></label>
              <label className="space-y-1 text-sm font-medium">Selection rule<input className={input} name="selectionRule" list={`${uid}-rules`} maxLength={40} defaultValue={category?.selectionRule ?? ""} placeholder="e.g. Any Two" /></label>
            </div>
            <datalist id={`${uid}-rules`}><option value="Any One" /><option value="Any Two" /><option value="Any Three" /><option value="All" /></datalist>
            <p className="text-xs text-muted">The selection rule prints beside the category heading in the PDF. Leave it blank if it is not needed.</p>
            <div className="flex flex-wrap gap-2"><button className={primary}>{pending ? "Saving…" : "Save category"}</button>{creating && <button type="button" className={button} onClick={() => setCreating(false)}>Cancel</button>}{category && <button type="button" className={`${button} text-error`} onClick={() => setDeletion({ type: "category", id: category.id, name: category.name })}>Delete category</button>}</div>
          </fieldset>
        </form>
        {category && <div className="mt-6 border-t border-border pt-5">
          <h3 className="mb-3 font-semibold">Dishes <span className="text-muted">({category.dishes.length})</span></h3>
          <form onSubmit={e => { e.preventDefault(); const element = e.currentTarget; const form = new FormData(element); run(() => saveDish(form), "Dish added.", () => element.reset()); }} className="mb-4 flex gap-2">
            <input type="hidden" name="categoryId" value={category.id} />
            <input name="name" aria-label="New dish name" className={input} required maxLength={120} disabled={pending} placeholder="Add a dish…" />
            <button className={`${primary} shrink-0`} disabled={pending}>Add dish</button>
          </form>
          <ul className="divide-y divide-border">{category.dishes.map(dish => <li key={dish.id} className="py-3">
            {editingDish === dish.id ? <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); run(() => saveDish(form), "Dish saved.", () => setEditingDish(null)); }}>
              <input type="hidden" name="id" value={dish.id} /><input type="hidden" name="categoryId" value={category.id} />
              <input aria-label="Edit dish name" name="name" className={`${input} min-w-40 flex-1`} defaultValue={dish.name} maxLength={120} required disabled={pending} autoFocus />
              <button className={primary} disabled={pending}>Save</button><button type="button" className={button} disabled={pending} onClick={() => setEditingDish(null)}>Cancel</button>
            </form> : <div className="flex items-center justify-between gap-3"><span className="break-words text-sm">{dish.name}</span><div className="flex shrink-0 gap-2"><button type="button" className={button} disabled={pending} aria-label={`Edit ${dish.name}`} onClick={() => setEditingDish(dish.id)}>Edit</button><button type="button" className={`${button} text-error`} disabled={pending} aria-label={`Delete ${dish.name}`} onClick={() => setDeletion({ type: "dish", id: dish.id, name: dish.name })}>Delete</button></div></div>}
          </li>)}</ul>
          {!category.dishes.length && <p className="py-4 text-sm text-muted">No dishes yet. Add the first dish above.</p>}
        </div>}
        {deletion && <div role="alert" className="mt-5 rounded-lg border border-error/30 bg-error-soft p-4">
          <p className="text-sm">Delete <strong>{deletion.name}</strong>? {deletion.type === "category" ? "This also deletes its dishes and removes the category from every menu using it." : "This removes the dish from every menu using this category."}</p>
          <div className="mt-3 flex gap-2"><button type="button" disabled={pending} className={`${button} text-error`} onClick={() => { const form = new FormData(); form.set("id", String(deletion.id)); run(() => deletion.type === "category" ? deleteCategory(form) : deleteDish(form), "Deleted successfully.", () => { setDeletion(null); setEditingDish(null); if (deletion.type === "category") setSelectedId(null); }); }}>Confirm delete</button><button type="button" disabled={pending} className={button} onClick={() => setDeletion(null)}>Cancel</button></div>
        </div>}
      </section>
    </div>
  </div>;
}
