"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  createOrder,
  updateOrder,
  type MealType,
  type OrderRecord,
} from "@/app/orders/actions";
import type { MaterialWithVendor } from "@/app/raw-materials/actions";

type OrderDialogProps = {
  open: boolean;
  order: OrderRecord | null;
  suggestedOrderId: string;
  rawMaterials: MaterialWithVendor[];
  onClose: () => void;
};

const mealOptions = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
] as const;

type RawMaterialItem = {
  rawMaterialId: number;
  unitQty: string;
  unitName: string;
  vendorId: number | null;
};

export function OrderDialog({
  open,
  order,
  suggestedOrderId,
  rawMaterials,
  onClose,
}: OrderDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [activeTab, setActiveTab] = useState<"details" | "materials">("details");
  const [selectedMaterials, setSelectedMaterials] = useState<RawMaterialItem[]>([]);
  const [formKey, setFormKey] = useState(0);

  const isEditing = order !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setError(null);
      setActiveTab("details");
      setMealType(order?.mealType ?? "lunch");
      
      const initMaterials = rawMaterials.map(rm => {
        const existing = order?.rawMaterials?.find(m => m.rawMaterialId === rm.id);
        const defaultVendorId = rm.rawMaterialVendors.length > 0 ? rm.rawMaterialVendors[0].vendor.id : null;
        
        return {
          rawMaterialId: rm.id,
          unitQty: existing?.unitQty ?? "",
          unitName: existing?.unitName ?? "kg",
          vendorId: existing?.vendorId ?? defaultVendorId,
        };
      });
      setSelectedMaterials(initMaterials);

      setFormKey((k) => k + 1);
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, order]);

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemsToSubmit = selectedMaterials.filter(
      (item) => item.unitQty.trim() !== "" && item.unitQty !== "0"
    );

    if (itemsToSubmit.length === 0) {
      setError("Please specify a quantity for at least one raw material.");
      setActiveTab("materials");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const data = {
      id: order?.id,
      orderId: String(formData.get("orderId") || ""),
      date: String(formData.get("date") || ""),
      venue: String(formData.get("venue") || ""),
      numberOfPersons: Number(formData.get("numberOfPersons")),
      mealType,
      rawMaterials: itemsToSubmit,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateOrder(data)
        : await createOrder(data);

      if (result.error) {
        setError(result.error);
        return;
      }

      handleClose();
    });
  }

  function updateMaterial(index: number, updates: Partial<RawMaterialItem>) {
    // Note: the index passed in here is the index in `rawMaterials`, 
    // which corresponds 1-to-1 with `selectedMaterials`
    const next = [...selectedMaterials];
    next[index] = { ...next[index], ...updates };
    setSelectedMaterials(next);
  }

  return (
    <dialog ref={dialogRef} onClose={handleClose} className="app-dialog app-dialog-wide">
      <form key={formKey} onSubmit={handleSubmit} className="flex flex-col">
        <datalist id="unit-options">
          <option value="kg" />
          <option value="liters" />
          <option value="units" />
          <option value="pieces" />
          <option value="boxes" />
          <option value="bottles" />
          <option value="plate" />
        </datalist>
        <div className="app-dialog-body px-5 pt-5 pb-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Edit order" : "Add order"}
          </h2>
          {isEditing ? <input type="hidden" name="id" value={order.id} /> : null}

          {/* Tabs */}
          <div className="mt-4 flex gap-4 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("materials")}
              className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                activeTab === "materials"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              Raw Materials
            </button>
          </div>

          <div className="mt-4">
            <div className={activeTab === "details" ? "space-y-4" : "hidden"}>
              <div>
                  <label
                    htmlFor="order-id"
                    className="block text-sm font-medium text-foreground"
                  >
                    Order ID
                  </label>
                  <input
                    id="order-id"
                    name="orderId"
                    type="text"
                    maxLength={32}
                    defaultValue={order?.orderId ?? suggestedOrderId}
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                    placeholder="e.g. ORD-001"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-date"
                    className="block text-sm font-medium text-foreground"
                  >
                    Event date
                  </label>
                  <input
                    id="order-date"
                    name="date"
                    type="date"
                    defaultValue={order?.date ?? ""}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-venue"
                    className="block text-sm font-medium text-foreground"
                  >
                    Venue
                  </label>
                  <input
                    id="order-venue"
                    name="venue"
                    type="text"
                    maxLength={200}
                    defaultValue={order?.venue ?? ""}
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                    placeholder="e.g. Grand Ballroom, Hotel Ashok"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-persons"
                    className="block text-sm font-medium text-foreground"
                  >
                    Number of persons
                  </label>
                  <input
                    id="order-persons"
                    name="numberOfPersons"
                    type="number"
                    min={1}
                    max={100000}
                    defaultValue={order?.numberOfPersons ?? 1}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                  />
                </div>

                <fieldset>
                  <legend className="block text-sm font-medium text-foreground">
                    Meal type
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {mealOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
                          mealType === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface text-muted hover:text-foreground"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mealTypeChoice"
                          value={option.value}
                          checked={mealType === option.value}
                          onChange={() => setMealType(option.value)}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

            <div className={activeTab === "materials" ? "space-y-4" : "hidden"}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Materials Selection</p>
              </div>
                
              {rawMaterials.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">No raw materials available. Please add some first.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {rawMaterials.map((material, index) => {
                    const item = selectedMaterials.find(sm => sm.rawMaterialId === material.id);
                    if (!item) return null;

                    return (
                      <div key={material.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border border-border p-3">
                        <div className="w-full sm:flex-1 space-y-1">
                          <label className="text-sm font-medium text-foreground [text-wrap:balance]">{material.name}</label>
                          <div className="mt-1">
                            {material.rawMaterialVendors.length === 0 ? (
                              <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">No Vendors</span>
                            ) : material.rawMaterialVendors.length === 1 ? (
                              <span className="inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                                {material.rawMaterialVendors[0].vendor.name}
                              </span>
                            ) : (
                              <select
                                value={item.vendorId ?? ""}
                                onChange={(e) => updateMaterial(index, { vendorId: Number(e.target.value) })}
                                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-ring/30"
                              >
                                {material.rawMaterialVendors.map((rmv) => (
                                  <option key={rmv.vendor.id} value={rmv.vendor.id}>{rmv.vendor.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                        <div className="flex w-full sm:w-auto items-center gap-3">
                          <div className="flex-1 sm:w-24">
                            <label className="sr-only">Qty</label>
                            <input
                              type="text"
                              value={item.unitQty}
                              onChange={(e) => updateMaterial(index, { unitQty: e.target.value })}
                              placeholder="Qty"
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                            />
                          </div>
                          <div className="flex-1 sm:w-24">
                            <label className="sr-only">Unit</label>
                            <input
                              type="text"
                              value={item.unitName}
                              onChange={(e) => updateMaterial(index, { unitName: e.target.value })}
                              placeholder="Unit (e.g. kg)"
                              list="unit-options"
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => updateMaterial(index, { unitQty: "" })}
                            className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50"
                            aria-label="Clear quantity"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
            {isPending ? "Saving…" : isEditing ? "Save changes" : "Add order"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
