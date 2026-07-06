"use client";

import { Pencil, Trash2, Truck } from "lucide-react";
import { useRef, useTransition } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function openDeleteDialog() {
    dialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    dialogRef.current?.close();
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", String(material.id));

    startTransition(async () => {
      await deleteMaterial(formData);
      closeDeleteDialog();
    });
  }

  const buttonClass =
    "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <>
      <div
        className={
          layout === "stacked"
            ? "flex items-center gap-2"
            : "flex shrink-0 items-center gap-2"
        }
      >
        <button
          type="button"
          onClick={() => onEdit(material)}
          aria-label={`Edit ${material.name}`}
          className={buttonClass}
        >
          <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          onClick={openDeleteDialog}
          aria-label={`Delete ${material.name}`}
          className={buttonClass}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="app-dialog"
        onClose={closeDeleteDialog}
      >
        <form method="dialog" className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-base font-semibold text-foreground">
              Delete material?
            </h2>
            <p className="mt-2 text-sm text-muted [text-wrap:pretty]">
              Delete &ldquo;{material.name}&rdquo;? This cannot be undone.
              {material.vendor
                ? " It will be removed from the assigned vendor."
                : null}
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function VendorBadge({ material }: { material: MaterialWithVendor }) {
  if (!material.vendor) {
    return (
      <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
        Unassigned
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
      <Truck className="size-3" strokeWidth={2} aria-hidden />
      {material.vendor.name}
    </span>
  );
}
