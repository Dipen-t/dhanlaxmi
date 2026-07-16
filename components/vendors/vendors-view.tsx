"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import type { VendorWithMaterials } from "@/app/vendors/actions";
import { FloatingAddButton } from "@/components/floating-add-button";
import { VendorDialog } from "@/components/vendors/vendor-dialog";
import { VendorGrid } from "@/components/vendors/vendor-grid";
import { VendorList } from "@/components/vendors/vendor-list";

type ViewMode = "grid" | "list";

type VendorsViewProps = {
  vendors: VendorWithMaterials[];
  materials: MaterialWithVendor[];
};

export function VendorsView({ vendors, materials }: VendorsViewProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorWithMaterials | null>(
    null,
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("vendors-view");
    if (stored === "grid" || stored === "list") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(stored);
    }
  }, []);

  const filteredVendors = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return vendors;

    return vendors.filter((vendor) => {
      const haystack = [
        vendor.name,
        vendor.phone,
        vendor.deliveryLocation,
        ...vendor.rawMaterials.map((material) => material.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [query, vendors]);

  function setViewMode(mode: ViewMode) {
    setView(mode);
    localStorage.setItem("vendors-view", mode);
  }

  function openCreate() {
    setEditingVendor(null);
    setDialogOpen(true);
  }

  function openEdit(vendor: VendorWithMaterials) {
    setEditingVendor(vendor);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingVendor(null);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search vendors</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vendors or materials"
              autoComplete="off"
              suppressHydrationWarning
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

        {vendors.length > 0 ? (
          <p className="mt-2.5 text-sm text-muted">
            {hasQuery ? (
              <>
                {filteredVendors.length} match
                {filteredVendors.length === 1 ? "" : "es"}
              </>
            ) : (
              <>
                {vendors.length} vendor{vendors.length === 1 ? "" : "s"}
              </>
            )}
          </p>
        ) : null}
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">No vendors yet</p>
          <p className="mt-1 text-sm text-muted">
            Tap the add button to create a vendor and assign raw materials.
          </p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-base font-medium text-foreground">No matches</p>
          <p className="mt-1 text-sm text-muted">
            Nothing found for &ldquo;{query.trim()}&rdquo;. Try another name,
            phone, or material.
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
        <VendorGrid vendors={filteredVendors} onEdit={openEdit} />
      ) : (
        <VendorList vendors={filteredVendors} onEdit={openEdit} />
      )}

      <VendorDialog
        open={dialogOpen}
        vendor={editingVendor}
        materials={materials}
        onClose={closeDialog}
      />

      <FloatingAddButton onClick={openCreate} label="Add vendor" />
    </>
  );
}
