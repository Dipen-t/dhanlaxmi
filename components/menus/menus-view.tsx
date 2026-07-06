"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { CategoryWithDishes, MenuSummary } from "@/app/menus/actions";
import { FloatingAddButton } from "@/components/floating-add-button";
import { MenuDialog } from "@/components/menus/menu-dialog";
import { MenuGrid } from "@/components/menus/menu-grid";
import { MenuList } from "@/components/menus/menu-list";

type ViewMode = "grid" | "list";

type MenusViewProps = {
  menus: MenuSummary[];
  catalog: CategoryWithDishes[];
};

export function MenusView({ menus, catalog }: MenusViewProps) {
  const [view, setView] = useState<ViewMode>("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuSummary | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("menus-view");
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
  }, []);

  const filteredMenus = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return menus;
    return menus.filter((menu) => menu.name.toLowerCase().includes(normalized));
  }, [menus, query]);

  function setViewMode(mode: ViewMode) {
    setView(mode);
    localStorage.setItem("menus-view", mode);
  }

  function openCreate() {
    setEditingMenu(null);
    setDialogOpen(true);
  }

  function openEdit(menu: MenuSummary) {
    setEditingMenu(menu);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingMenu(null);
  }

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <label className="relative block min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search menus"
            className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </label>

        <div
          className="inline-flex shrink-0 rounded-lg border border-border p-1"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            aria-pressed={view === "grid"}
            onClick={() => setViewMode("grid")}
            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              view === "grid"
                ? "bg-primary-soft text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-4" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">Grid view</span>
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setViewMode("list")}
            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              view === "list"
                ? "bg-primary-soft text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            <List className="size-4" strokeWidth={1.75} aria-hidden />
            <span className="sr-only">List view</span>
          </button>
        </div>
      </div>

      {menus.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">No menus yet</p>
          <p className="mt-1 text-sm text-muted">
            Tap the add button to create a menu from your dish catalog.
          </p>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm text-muted">No menus match your search.</p>
        </div>
      ) : view === "grid" ? (
        <MenuGrid menus={filteredMenus} onEdit={openEdit} />
      ) : (
        <MenuList menus={filteredMenus} onEdit={openEdit} />
      )}

      <MenuDialog
        open={dialogOpen}
        menu={editingMenu}
        catalog={catalog}
        onClose={closeDialog}
      />

      <FloatingAddButton onClick={openCreate} label="Create menu" />
    </>
  );
}
