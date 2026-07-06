"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import {
  createVendor,
  updateVendor,
  type DeliveryLocation,
  type VendorWithMaterials,
} from "@/app/vendors/actions";

type VendorDialogProps = {
  open: boolean;
  vendor: VendorWithMaterials | null;
  materials: MaterialWithVendor[];
  onClose: () => void;
};

export function VendorDialog({
  open,
  vendor,
  materials,
  onClose,
}: VendorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>(
    "venue",
  );

  const isEditing = vendor !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setError(null);
      setDeliveryLocation(vendor?.deliveryLocation ?? "venue");
      setSelectedMaterialIds(vendor?.rawMaterials.map((m) => m.id) ?? []);
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, vendor]);

  function handleClose() {
    setError(null);
    onClose();
  }

  function toggleMaterial(id: number) {
    setSelectedMaterialIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    selectedMaterialIds.forEach((id) => {
      formData.append("materialIds", String(id));
    });

    startTransition(async () => {
      const result = isEditing
        ? await updateVendor(formData)
        : await createVendor(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      handleClose();
    });
  }

  const selectableMaterials = materials.filter(
    (material) =>
      material.vendorId === null || material.vendorId === vendor?.id,
  );

  return (
    <dialog ref={dialogRef} onClose={handleClose} className="app-dialog app-dialog-wide">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="app-dialog-body min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Edit vendor" : "Add vendor"}
          </h2>
          {isEditing ? <input type="hidden" name="id" value={vendor.id} /> : null}
          <input type="hidden" name="deliveryLocation" value={deliveryLocation} />

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="vendor-name"
                className="block text-sm font-medium text-foreground"
              >
                Vendor name
              </label>
              <input
                id="vendor-name"
                name="name"
                type="text"
                required
                maxLength={120}
                defaultValue={vendor?.name ?? ""}
                autoComplete="organization"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. Fresh Farms Supply"
              />
            </div>

            <div>
              <label
                htmlFor="vendor-phone"
                className="block text-sm font-medium text-foreground"
              >
                Phone number
              </label>
              <input
                id="vendor-phone"
                name="phone"
                type="tel"
                required
                maxLength={20}
                defaultValue={vendor?.phone ?? ""}
                autoComplete="tel"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. +91 98765 43210"
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-foreground">
                Deliver to
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    { value: "venue", label: "Venue" },
                    { value: "godown", label: "Godown" },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={`inline-flex min-h-10 cursor-pointer items-center rounded-lg border px-4 text-sm font-medium transition-colors ${
                      deliveryLocation === option.value
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryLocationChoice"
                      value={option.value}
                      checked={deliveryLocation === option.value}
                      onChange={() => setDeliveryLocation(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="block text-sm font-medium text-foreground">
                Raw materials
              </legend>
              <div className="mt-2 min-h-[calc(5*2.5rem+4*0.625rem+1.5rem)] max-h-96 overflow-y-auto rounded-lg border border-border p-3">
                {selectableMaterials.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted">
                    No materials available to assign.
                  </p>
                ) : (
                  <ul className="grid grid-cols-2 gap-2.5">
                    {selectableMaterials.map((material) => {
                      const checked = selectedMaterialIds.includes(material.id);

                      return (
                        <li key={material.id}>
                          <label
                            title={material.name}
                            className={`flex min-h-10 w-full cursor-pointer items-center justify-center rounded-full px-3 py-2 text-center text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-ring ${
                              checked
                                ? "bg-primary text-primary-foreground"
                                : "bg-surface text-muted hover:text-foreground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMaterial(material.id)}
                              className="sr-only"
                            />
                            <span className="line-clamp-1">{material.name}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </fieldset>
          </div>

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
            {isPending ? "Saving…" : isEditing ? "Save changes" : "Add vendor"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
