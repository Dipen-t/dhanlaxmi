"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { deleteVendor, type VendorWithMaterials } from "@/app/vendors/actions";

type VendorActionsProps = {
  vendor: VendorWithMaterials;
  onEdit: (vendor: VendorWithMaterials) => void;
  layout?: "inline" | "stacked";
};

export function VendorActions({
  vendor,
  onEdit,
  layout = "inline",
}: VendorActionsProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!deleteOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDeleteOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteOpen]);

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", String(vendor.id));

    startTransition(async () => {
      await deleteVendor(formData);
      setDeleteOpen(false);
    });
  }

  const buttonClass =
    "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

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
          onClick={() => onEdit(vendor)}
          aria-label={`Edit ${vendor.name}`}
          className={buttonClass}
        >
          <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          aria-label={`Delete ${vendor.name}`}
          className={buttonClass}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {mounted && deleteOpen
        ? createPortal(
            <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
              <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0 bg-[oklch(0.22_0.02_175/0.45)]"
                onClick={() => setDeleteOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-2xl border border-border bg-background text-foreground sm:rounded-xl"
                style={{
                  paddingBottom: "env(safe-area-inset-bottom, 0px)",
                }}
              >
                <div className="px-5 pt-5 pb-4">
                  <h2
                    id={titleId}
                    className="text-base font-semibold text-foreground"
                  >
                    Delete vendor?
                  </h2>
                  <p className="mt-2 text-sm text-muted text-pretty">
                    Delete &ldquo;{vendor.name}&rdquo;? Assigned materials will
                    become unassigned.
                  </p>
                </div>
                <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(false)}
                    className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-red-200 bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 disabled:opacity-50"
                  >
                    {isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
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
