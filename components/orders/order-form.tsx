"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createOrder,
  updateOrder,
  type MealType,
  type OrderRecord,
} from "@/app/orders/actions";
import type { MaterialWithVendor } from "@/app/raw-materials/actions";

type OrderFormProps = {
  order: OrderRecord | null;
  suggestedOrderId: string;
  rawMaterials: MaterialWithVendor[];
};

const mealOptions = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
] as const;

const predefinedUnits = [
  "kg",
  "liters",
  "units",
  "pieces",
  "boxes",
  "bottles",
  "plate",
];

type RawMaterialItem = {
  rawMaterialId: number;
  unitQty: string;
  unitName: string;
  vendorId: number | null;
};

export function OrderForm({
  order,
  suggestedOrderId,
  rawMaterials,
}: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const isEditing = order !== null;

  const [mealType, setMealType] = useState<MealType>(order?.mealType ?? "lunch");
  const [focusedUnitIndex, setFocusedUnitIndex] = useState<number | null>(null);

  const [selectedMaterials, setSelectedMaterials] = useState<RawMaterialItem[]>(() => {
    return rawMaterials.map(rm => {
      const existing = order?.rawMaterials?.find(m => m.rawMaterialId === rm.id);
      const defaultVendorId = rm.rawMaterialVendors.length > 0 ? rm.rawMaterialVendors[0].vendor.id : null;
      
      return {
        rawMaterialId: rm.id,
        unitQty: existing?.unitQty ?? "",
        unitName: existing?.unitName ?? "",
        vendorId: existing?.vendorId ?? defaultVendorId,
      };
    });
  });

  function handleCancel() {
    router.push("/orders");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemsToSubmit = selectedMaterials.filter(
      (item) => item.unitQty.trim() !== "" && item.unitQty !== "0"
    );

    if (itemsToSubmit.length === 0) {
      setError("Please specify a quantity for at least one raw material.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (itemsToSubmit.some(item => item.unitName.trim() === "")) {
      setError("Please specify a unit for all selected materials.");
      window.scrollTo({ top: 0, behavior: "smooth" });
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
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      router.push("/orders");
    });
  }

  function updateMaterial(index: number, updates: Partial<RawMaterialItem>) {
    const next = [...selectedMaterials];
    next[index] = { ...next[index], ...updates };
    setSelectedMaterials(next);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-12">
      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Order Details</h2>
        
        {isEditing ? <input type="hidden" name="id" value={order.id} /> : null}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="order-id" className="block text-sm font-medium text-foreground mb-1.5">
              Order ID
            </label>
            <input
              id="order-id"
              name="orderId"
              type="text"
              maxLength={32}
              defaultValue={order?.orderId ?? suggestedOrderId}
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
              placeholder="e.g. ORD-001"
            />
          </div>

          <div>
            <label htmlFor="order-date" className="block text-sm font-medium text-foreground mb-1.5">
              Event date
            </label>
            <input
              id="order-date"
              name="date"
              type="date"
              defaultValue={order?.date ?? ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label htmlFor="order-venue" className="block text-sm font-medium text-foreground mb-1.5">
              Venue
            </label>
            <input
              id="order-venue"
              name="venue"
              type="text"
              maxLength={200}
              defaultValue={order?.venue ?? ""}
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
              placeholder="e.g. Grand Ballroom"
            />
          </div>

          <div>
            <label htmlFor="order-persons" className="block text-sm font-medium text-foreground mb-1.5">
              Number of persons
            </label>
            <input
              id="order-persons"
              name="numberOfPersons"
              type="number"
              min={1}
              max={100000}
              defaultValue={order?.numberOfPersons ?? 1}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <fieldset className="md:col-span-2 lg:col-span-4">
            <legend className="block text-sm font-medium text-foreground mb-2">
              Meal type
            </legend>
            <div className="flex flex-wrap gap-3">
              {mealOptions.map((option) => (
                <label
                  key={option.value}
                  className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full px-5 text-sm font-medium transition-colors ${
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
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Materials Selection</h2>
        
        {rawMaterials.length === 0 ? (
          <p className="text-sm text-muted py-4">No raw materials available. Please add some first.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rawMaterials.map((material, index) => {
              const item = selectedMaterials.find(sm => sm.rawMaterialId === material.id);
              if (!item) return null;

              return (
                <div key={material.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 bg-background">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground line-clamp-1" title={material.name}>
                      {material.name}
                    </label>
                    <div className="mt-1">
                      {material.rawMaterialVendors.length === 0 ? (
                        <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">No Vendors</span>
                      ) : material.rawMaterialVendors.length === 1 ? (
                        <span className="inline-flex items-center rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary line-clamp-1" title={material.rawMaterialVendors[0].vendor.name}>
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
                  
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <div className="flex-1">
                      <label className="sr-only">Qty</label>
                      <input
                        type="text"
                        value={item.unitQty}
                        onChange={(e) => updateMaterial(index, { unitQty: e.target.value })}
                        placeholder="Qty"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <label className="sr-only">Unit</label>
                      <input
                        type="text"
                        value={item.unitName}
                        onFocus={() => setFocusedUnitIndex(index)}
                        onClick={() => setFocusedUnitIndex(index)}
                        onBlur={() => setTimeout(() => setFocusedUnitIndex(null), 150)}
                        onChange={(e) => updateMaterial(index, { unitName: e.target.value })}
                        placeholder="Unit"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
                      />
                      {focusedUnitIndex === index && (
                        <ul className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-border bg-background py-1 shadow-lg ring-1 ring-black/5">
                          {predefinedUnits.map(unit => (
                            <li
                              key={unit}
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input from losing focus
                                updateMaterial(index, { unitName: unit });
                                setFocusedUnitIndex(null);
                              }}
                              className="cursor-pointer px-3 py-1.5 text-sm text-foreground hover:bg-surface"
                            >
                              {unit}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateMaterial(index, { unitQty: "" })}
                      className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
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

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          {isPending ? "Saving…" : isEditing ? "Save changes" : "Create order"}
        </button>
      </div>
    </form>
  );
}
