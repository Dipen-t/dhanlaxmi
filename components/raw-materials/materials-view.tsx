"use client";

import { LayoutGrid, List } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [view, setView] = useState<ViewMode>("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] =
    useState<MaterialWithVendor | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("materials-view");
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
  }, []);

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

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div
          className="inline-flex rounded-lg border border-border p-1"
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

      {materials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">No materials yet</p>
          <p className="mt-1 text-sm text-muted">
            Tap the add button to create your first material. Assign vendors from
            the Vendors page.
          </p>
        </div>
      ) : view === "grid" ? (
        <MaterialGrid materials={materials} onEdit={openEdit} />
      ) : (
        <MaterialList materials={materials} onEdit={openEdit} />
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
