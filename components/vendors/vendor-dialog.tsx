"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { createPortal } from "react-dom";

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
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([]);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>(
    "venue",
  );

  const isEditing = vendor !== null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormKey((key) => key + 1);
    setError(null);
    setDeliveryLocation(vendor?.deliveryLocation ?? "venue");
    setSelectedMaterialIds(vendor?.rawMaterials.map((m) => m.id) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening / vendor changes
  }, [open, vendor?.id]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    event.stopPropagation();

    const formData = new FormData(event.currentTarget);

    selectedMaterialIds.forEach((id) => {
      formData.append("materialIds", String(id));
    });

    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateVendor(formData)
          : await createVendor(formData);

        if (result.error) {
          setError(result.error);
          return;
        }

        handleClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  const selectableMaterials = materials;

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[oklch(0.22_0.02_175/0.45)]"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background text-foreground sm:rounded-xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-4 sm:px-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
              
              {/* Left Column - Details */}
              <div className="md:col-span-5 flex flex-col space-y-5">
                <div>
                  <h2
                    id={titleId}
                    className="text-lg font-semibold tracking-[-0.02em] text-foreground"
                  >
                    {isEditing ? "Edit vendor" : "Add vendor"}
                  </h2>
                  <p className="mt-1 text-sm text-muted text-pretty">
                    Set contact details and delivery location.
                  </p>
                </div>

                {isEditing ? (
                  <input type="hidden" name="id" value={vendor.id} />
                ) : null}
                <input
                  type="hidden"
                  name="deliveryLocation"
                  value={deliveryLocation}
                />

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="vendor-name"
                      className="block text-sm font-medium text-foreground mb-1.5"
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
                      enterKeyHint="next"
                      className="min-h-12 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                      placeholder="e.g. Fresh Farms Supply"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vendor-phone"
                      className="block text-sm font-medium text-foreground mb-1.5"
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
                      enterKeyHint="done"
                      className="min-h-12 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <fieldset>
                    <legend className="block text-sm font-medium text-foreground mb-1.5">
                      Deliver to
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { value: "venue", label: "Venue" },
                          { value: "godown", label: "Godown" },
                        ] as const
                      ).map((option) => (
                        <label
                          key={option.value}
                          className={`inline-flex min-h-11 touch-manipulation cursor-pointer items-center rounded-lg border px-5 text-sm font-medium transition-colors flex-1 justify-center ${
                            deliveryLocation === option.value
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border text-muted hover:text-foreground hover:bg-surface/50"
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
                </div>
              </div>

              {/* Right Column - Materials */}
              <div className="md:col-span-7 min-w-0 flex flex-col">
                <fieldset className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <legend className="text-sm font-medium text-foreground">
                      Raw materials
                    </legend>
                    <span className="text-xs font-medium text-muted bg-surface px-2 py-0.5 rounded-md">
                      {selectedMaterialIds.length} selected
                    </span>
                  </div>
                  
                  <div className="max-h-[min(50dvh,24rem)] overflow-y-auto overscroll-contain touch-pan-y rounded-xl border border-border p-3 md:p-4 bg-surface/30">
                    {selectableMaterials.length === 0 ? (
                      <div className="flex h-full items-center justify-center p-6 text-center">
                        <p className="text-sm text-muted">
                          No materials available to assign.
                        </p>
                      </div>
                    ) : (
                      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
                        {selectableMaterials.map((material) => {
                          const checked = selectedMaterialIds.includes(
                            material.id,
                          );
                          const isAssignedToOther = vendor
                            ? material.rawMaterialVendors.some(
                                (rmv) => rmv.vendor.id !== vendor.id,
                              )
                            : material.rawMaterialVendors.length > 0;

                          return (
                            <li key={material.id}>
                              <label
                                title={
                                  isAssignedToOther
                                    ? `${material.name} (Assigned to other vendors)`
                                    : material.name
                                }
                              className={`flex h-14 w-full touch-pan-y cursor-pointer items-center justify-center rounded-xl px-3 py-2 text-center text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-ring ${
                                  checked
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : isAssignedToOther
                                      ? "bg-primary-soft text-primary border border-primary/20 hover:bg-primary/20"
                                      : "bg-background border border-border text-muted hover:border-primary/40 hover:text-foreground"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleMaterial(material.id)}
                                  className="sr-only"
                                />
                                <span className="line-clamp-2 leading-tight">
                                  {material.name}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </fieldset>
              </div>

            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm font-medium text-error">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 touch-manipulation items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isPending
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Add vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
