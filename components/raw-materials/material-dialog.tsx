"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

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
  const savingRef = useRef(false);
  const titleId = useId();
  const nameId = useId();
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
    if (savingRef.current) return;
    setError(null);
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current) return;
    const formData = new FormData(event.currentTarget);
    savingRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = isEditing ? await updateMaterial(formData) : await createMaterial(formData);
        if (result.error) { setError(result.error); return; }
        toast.success(isEditing ? "Material updated" : "Material added");
        savingRef.current = false;
        handleClose();
      } catch { setError("Could not save this material. Check your connection and try again."); }
      finally { savingRef.current = false; }
    });
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      onCancel={event => { if (savingRef.current) event.preventDefault(); }}
      aria-labelledby={titleId}
      className="app-dialog"
    >
      <form key={`${open}-${material?.id ?? "new"}`} onSubmit={handleSubmit} className="flex flex-col">
        <div className="px-5 pt-5 pb-4">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            {isEditing ? "Edit material" : "Add material"}
          </h2>
          {isEditing ? (
            <input type="hidden" name="id" value={material.id} />
          ) : null}
          <div className="mt-4">
            <label
              htmlFor={nameId}
              className="block text-sm font-medium text-foreground"
            >
              Material name
            </label>
            <input
              id={nameId}
              disabled={isPending}
              name="name"
              type="text"
              required
              maxLength={120}
              defaultValue={material?.name ?? ""}
              autoComplete="off"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
              placeholder="e.g. Paneer"
            />
          </div>
          {isEditing && material.rawMaterialVendors.length > 0 ? (
            <p className="mt-3 text-xs text-muted [text-wrap:pretty]">
              Assigned to {material.rawMaterialVendors.map(v => v.vendor.name).join(", ")}. Change vendor assignments on
              the Vendors page.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted [text-wrap:pretty]">
              Vendor assignment is managed on the Vendors page.
            </p>
          )}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-error">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
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
