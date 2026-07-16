"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import { FloatingAddButton } from "@/components/floating-add-button";
import { MaterialDialog } from "@/components/raw-materials/material-dialog";
import { MaterialGrid } from "@/components/raw-materials/material-grid";
import { MaterialList } from "@/components/raw-materials/material-list";

type ViewMode = "grid" | "list";

type MaterialsViewProps = {
  materials: MaterialWithVendor[];
};

export function MaterialsView({ materials }: MaterialsViewProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<MaterialWithVendor | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("materials-view");
    if (stored === "grid" || stored === "list") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(stored);
    }
  }, []);

  const filteredMaterials = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return materials;

    return materials.filter((material) => {
      const vendorNames = material.rawMaterialVendors
        .map((row) => row.vendor.name)
        .join(" ");
      const haystack = `${material.name} ${vendorNames}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [materials, query]);

  const unassignedCount = useMemo(
    () =>
      filteredMaterials.filter((material) => material.rawMaterialVendors.length === 0)
        .length,
    [filteredMaterials],
  );

  function setViewMode(mode: ViewMode) {
    setView(mode);
    localStorage.setItem("materials-view", mode);
  }

  function openCreate() {
    setEditingMaterial(null);
    setDialogOpen(true);
  }

  function openEdit(material: MaterialWithVendor) {
    setEditingMaterial(material);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingMaterial(null);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search materials</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or vendor"
              autoComplete="off"
              className="min-h-11 w-full rounded-lg border border-border bg-background py-2.5 pr-10 pl-10 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
            {hasQuery ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

        {materials.length > 0 ? (
          <p className="mt-2.5 text-sm text-muted">
            {hasQuery ? (
              <>
                {filteredMaterials.length} match
                {filteredMaterials.length === 1 ? "" : "es"}
                {unassignedCount > 0
                  ? ` · ${unassignedCount} unassigned`
                  : null}
              </>
            ) : (
              <>
                {materials.length} material{materials.length === 1 ? "" : "s"}
                {unassignedCount > 0
                  ? ` · ${unassignedCount} unassigned`
                  : null}
              </>
            )}
          </p>
        ) : null}
      </div>

      {materials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">No materials yet</p>
          <p className="mt-1 text-sm text-muted">
            Tap the add button to create your first material. Assign vendors from
            the Vendors page.
          </p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-base font-medium text-foreground">No matches</p>
          <p className="mt-1 text-sm text-muted">
            Nothing found for &ldquo;{query.trim()}&rdquo;. Try another name or
            vendor.
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear search
          </button>
        </div>
      ) : view === "grid" ? (
        <MaterialGrid materials={filteredMaterials} onEdit={openEdit} />
      ) : (
        <MaterialList materials={filteredMaterials} onEdit={openEdit} />
      )}

      <MaterialDialog
        open={dialogOpen}
        material={editingMaterial}
        onClose={closeDialog}
      />

      <FloatingAddButton onClick={openCreate} label="Add material" />
    </>
  );
}
