"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuSummary | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("menus-view");
    const frame = requestAnimationFrame(() => {
      if (stored === "grid" || stored === "list") setView(stored);
    });
    return () => cancelAnimationFrame(frame);
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

  function openView(menu: MenuSummary) {
    router.push(`/menus/${menu.id}`);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingMenu(null);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Link href="/menus/catalog" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Category &amp; Dishes
        </Link>
      </div>
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search menus</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search menus"
              autoComplete="off"
              suppressHydrationWarning
              className="min-h-11 w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-10 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
            {hasQuery ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 touch-manipulation items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
          </label>

          <div
            className="inline-flex shrink-0 rounded-lg border border-border p-1"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setViewMode("list")}
              className={`inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                view === "list"
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <List className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">List view</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "grid"}
              onClick={() => setViewMode("grid")}
              className={`inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                view === "grid"
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-4" strokeWidth={1.75} aria-hidden />
              <span className="sr-only">Grid view</span>
            </button>
          </div>
        </div>
      </div>

      {menus.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-lg font-semibold text-foreground">No menus yet</p>
          <p className="mt-1 text-base text-muted text-pretty">
            Tap the add button to create a menu from your dish catalog.
          </p>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-base text-muted">No menus match your search.</p>
        </div>
      ) : view === "list" ? (
        <MenuList
          menus={filteredMenus}
          onEdit={openEdit}
          onView={openView}
        />
      ) : (
        <MenuGrid
          menus={filteredMenus}
          onEdit={openEdit}
          onView={openView}
        />
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
