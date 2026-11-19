"use client";

import { Pencil, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import {
  deleteMaterial,
  type MaterialWithVendor,
} from "@/app/raw-materials/actions";

type MaterialActionsProps = {
  material: MaterialWithVendor;
  onEdit: (material: MaterialWithVendor) => void;
  layout?: "inline" | "stacked";
};

export function MaterialActions({
  material,
  onEdit,
  layout = "inline",
}: MaterialActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  function openDeleteDialog() { setDeleteOpen(true); }

  async function handleDelete() {
    const formData = new FormData();
    formData.set("id", String(material.id));
    return deleteMaterial(formData);
  }

  const buttonClass =
    "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <>
      <div
        className={
          layout === "stacked"
            ? "flex w-full items-center gap-2"
            : "flex shrink-0 items-center gap-2"
        }
      >
        <button
          type="button"
          onClick={() => onEdit(material)}
          aria-label={`Edit ${material.name}`}
          title={`Edit ${material.name}`}
          className={`${buttonClass}${layout === "stacked" ? " flex-1" : ""}`}
        >
          <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
          {layout === "stacked" ? (
            <span className="text-sm font-medium text-foreground">Edit</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={openDeleteDialog}
          aria-label={`Delete ${material.name}`}
          title={`Delete ${material.name}`}
          className={`${buttonClass}${layout === "stacked" ? " flex-1" : ""}`}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
          {layout === "stacked" ? (
            <span className="text-sm font-medium text-foreground">Delete</span>
          ) : null}
        </button>
      </div>

      <DeleteConfirmation
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete material?"
        message={`Delete "${material.name}"? This cannot be undone. It will also be removed from assigned vendors.`}
        action={handleDelete}
        successMessage="Material deleted"
      />
    </>
  );
}

export function VendorBadge({ material }: { material: MaterialWithVendor }) {
  if (material.rawMaterialVendors.length === 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-surface px-2.5 py-1 text-sm font-medium text-muted">
        Unassigned
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {material.rawMaterialVendors.map((rmv) => (
        <span
          key={rmv.vendor.id}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2.5 py-1 text-sm font-medium text-primary"
        >
          <Truck className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          {rmv.vendor.name}
        </span>
      ))}
    </div>
  );
}
