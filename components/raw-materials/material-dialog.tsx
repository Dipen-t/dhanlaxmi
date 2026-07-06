"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  createMaterial,
  updateMaterial,
  type MaterialWithVendor,
} from "@/app/raw-materials/actions";

type MaterialDialogProps = {
  open: boolean;
  material: MaterialWithVendor | null;
  onClose: () => void;
};

export function MaterialDialog({ open, material, onClose }: MaterialDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = material !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setError(null);
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = isEditing
        ? await updateMaterial(formData)
        : await createMaterial(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      handleClose();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="app-dialog"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Edit material" : "Add material"}
          </h2>
          {isEditing ? (
            <input type="hidden" name="id" value={material.id} />
          ) : null}
          <div className="mt-4">
            <label
              htmlFor="material-name"
              className="block text-sm font-medium text-foreground"
            >
              Material name
            </label>
            <input
              id="material-name"
              name="name"
              type="text"
              required
              maxLength={120}
              defaultValue={material?.name ?? ""}
              autoComplete="off"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
              placeholder="e.g. Paneer"
            />
          </div>
          {isEditing && material.vendor ? (
            <p className="mt-3 text-xs text-muted [text-wrap:pretty]">
              Assigned to {material.vendor.name}. Change vendor assignments on
              the Vendors page.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted [text-wrap:pretty]">
              Vendor assignment is managed on the Vendors page.
            </p>
          )}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-primary">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {isPending ? "Saving…" : isEditing ? "Save changes" : "Add material"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
