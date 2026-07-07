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

  const isEditing = order !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setError(null);
      setActiveTab("details");
      setMealType(order?.mealType ?? "lunch");
      setSelectedMaterials(order?.rawMaterials ? [...order.rawMaterials] : []);
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

    if (selectedMaterials.length === 0) {
      setError("Please add at least one raw material.");
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
      rawMaterials: selectedMaterials,
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

  function addMaterial() {
    if (rawMaterials.length === 0) return;
    setSelectedMaterials([
      ...selectedMaterials,
      { rawMaterialId: rawMaterials[0].id, unitQty: "1", unitName: "kg" },
    ]);
  }

  function updateMaterial(index: number, updates: Partial<RawMaterialItem>) {
    const next = [...selectedMaterials];
    next[index] = { ...next[index], ...updates };
    setSelectedMaterials(next);
  }

  function removeMaterial(index: number) {
    const next = [...selectedMaterials];
    next.splice(index, 1);
    setSelectedMaterials(next);
  }

  return (
    <dialog ref={dialogRef} onClose={handleClose} className="app-dialog app-dialog-wide">
      <form onSubmit={handleSubmit} className="flex flex-col">
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
            {activeTab === "details" && (
              <div className="space-y-4">
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
                    required
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
                    required
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
                    required
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
                    required
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
            )}

            {activeTab === "materials" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Selected Materials</p>
                  <button
                    type="button"
                    onClick={addMaterial}
                    disabled={rawMaterials.length === 0}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
                  >
                    <Plus className="size-3.5" />
                    Add item
                  </button>
                </div>
                
                {rawMaterials.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">No raw materials available. Please add some first.</p>
                ) : selectedMaterials.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">No materials added to this order.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedMaterials.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="flex-1 space-y-1">
                          <label className="sr-only">Material</label>
                          <select
                            value={item.rawMaterialId}
                            onChange={(e) => updateMaterial(index, { rawMaterialId: Number(e.target.value) })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                          >
                            {rawMaterials.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="sr-only">Qty</label>
                          <input
                            type="text"
                            value={item.unitQty}
                            onChange={(e) => updateMaterial(index, { unitQty: e.target.value })}
                            placeholder="Qty"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                          />
                        </div>
                        <div className="w-24">
                          <label className="sr-only">Unit</label>
                          <input
                            type="text"
                            value={item.unitName}
                            onChange={(e) => updateMaterial(index, { unitName: e.target.value })}
                            placeholder="Unit (e.g. kg)"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50"
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
