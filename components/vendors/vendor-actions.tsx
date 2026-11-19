"use client";

import { Pencil, Trash2, IndianRupee } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { deleteVendor, type VendorWithMaterials } from "@/app/vendors/actions";

type VendorActionsProps = {
  vendor: VendorWithMaterials;
  onEdit: (vendor: VendorWithMaterials) => void;
  onFinance?: (vendor: VendorWithMaterials) => void;
  layout?: "inline" | "stacked";
};

export function VendorActions({
  vendor,
  onEdit,
  onFinance,
  layout = "inline",
}: VendorActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete() {
    const formData = new FormData();
    formData.set("id", String(vendor.id));
    return deleteVendor(formData);
  }

  const buttonClass =
    "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <>
      <div
        className={
          layout === "stacked"
            ? "flex flex-wrap items-center gap-2"
            : "flex shrink-0 items-center gap-2"
        }
      >
        <button
          type="button"
          onClick={() => onEdit(vendor)}
          aria-label={`Edit ${vendor.name}`}
          title={`Edit ${vendor.name}`}
          className={buttonClass}
        >
          <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
          {layout === "stacked" ? <span className="text-sm">Edit</span> : null}
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          aria-label={`Delete ${vendor.name}`}
          title={`Delete ${vendor.name}`}
          className={buttonClass}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
          {layout === "stacked" ? <span className="text-sm">Delete</span> : null}
        </button>
        {onFinance && (
          <button
            type="button"
            onClick={() => onFinance(vendor)}
            aria-label={`Finance for ${vendor.name}`}
          title={`Finance for ${vendor.name}`}
            className={buttonClass}
          >
            <IndianRupee className="size-4 text-emerald-600" strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>

      <DeleteConfirmation
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete vendor?"
        message={`Delete "${vendor.name}"? Assigned materials will become unassigned. This cannot be undone.`}
        action={handleDelete}
        successMessage="Vendor deleted"
      />
    </>
  );
}

export function DeliveryBadge({
  location,
}: {
  location: VendorWithMaterials["deliveryLocation"];
}) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
      {location === "venue" ? "Venue" : "Godown"}
    </span>
  );
}

export function MaterialsSummary({
  materials,
}: {
  materials: VendorWithMaterials["rawMaterials"];
}) {
  if (materials.length === 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
        No materials
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
      {materials.length} material{materials.length === 1 ? "" : "s"}
    </span>
  );
}
