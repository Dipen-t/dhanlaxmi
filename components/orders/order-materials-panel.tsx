"use client";

import { Check, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import { QtyStepper } from "@/components/orders/qty-stepper";

export type OrderMaterialDraft = {
  rawMaterialId: number;
  unitQty: string;
  unitName: string;
  notes?: string;
  vendorId: number | null;
};

const PREDEFINED_UNITS = [
  "kg",
  "liters",
  "units",
  "pieces",
  "boxes",
  "bottles",
  "plate",
] as const;

type OrderMaterialsPanelProps = {
  materials: MaterialWithVendor[];
  sortedMaterials: MaterialWithVendor[];
  selectedMaterials: OrderMaterialDraft[];
  onUpdate: (
    rawMaterialId: number,
    updates: Partial<OrderMaterialDraft>,
  ) => void;
  onCommitOrder: () => void;
};

function isComplete(item: OrderMaterialDraft) {
  return (
    item.unitQty.trim() !== "" &&
    item.unitQty !== "0" &&
    item.unitName.trim() !== ""
  );
}

function hasQty(item: OrderMaterialDraft) {
  return item.unitQty.trim() !== "" && item.unitQty !== "0";
}

export function OrderMaterialsPanel({
  materials,
  sortedMaterials,
  selectedMaterials,
  onUpdate,
  onCommitOrder,
}: OrderMaterialsPanelProps) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const selectedById = useMemo(() => {
    const map = new Map<number, OrderMaterialDraft>();
    for (const item of selectedMaterials) {
      map.set(item.rawMaterialId, item);
    }
    return map;
  }, [selectedMaterials]);

  const visibleMaterials = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return sortedMaterials.filter((material) => {
      const item = selectedById.get(material.id);
      if (!item) return false;
      if (!normalized) return true;

      const vendorNames = material.rawMaterialVendors
        .map((row) => row.vendor.name)
        .join(" ");
      return `${material.name} ${vendorNames}`.toLowerCase().includes(normalized);
    });
  }, [sortedMaterials, selectedById, query]);

  const editingMaterial = useMemo(
    () =>
      editingId === null
        ? null
        : (materials.find((material) => material.id === editingId) ?? null),
    [editingId, materials],
  );

  const editingItem =
    editingId === null ? null : (selectedById.get(editingId) ?? null);

  function openEditor(materialId: number) {
    if (editingId !== null && editingId !== materialId) {
      onCommitOrder();
    }
    setEditingId(materialId);
  }

  function closeEditor() {
    setEditingId(null);
    onCommitOrder();
  }

  function clearEditingMaterial() {
    if (editingId === null) return;
    onUpdate(editingId, { unitQty: "", unitName: "" });
    setEditingId(null);
    onCommitOrder();
  }

  if (materials.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-6 py-10">
        <p className="text-center text-base text-muted">
          No raw materials available. Please add some first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="shrink-0 rounded-xl border border-border bg-background p-2.5 sm:p-3">
        <label className="relative block">
          <span className="sr-only">Search materials</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search materials or vendors"
            className="min-h-12 w-full rounded-lg border border-border bg-background py-2.5 pr-11 pl-11 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 touch-manipulation items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </label>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-background">
        {visibleMaterials.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-10">
            <p className="text-center text-base text-muted">
              No materials match “{query.trim()}”.
            </p>
          </div>
        ) : (
          <div
            className={`h-full overflow-y-auto overscroll-contain p-2 sm:p-2.5 ${
              editingMaterial ? "pt-60 sm:pt-48 lg:pt-48" : ""
            }`}
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(8.25rem,1fr))] gap-1.5 lg:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] lg:gap-2">
              {visibleMaterials.map((material) => {
                const item = selectedById.get(material.id);
                if (!item) return null;

                const complete = isComplete(item);
                const partial = hasQty(item) && !complete;
                const active = editingId === material.id;
                const vendorName = item.vendorId 
                  ? material.rawMaterialVendors.find(v => v.vendor.id === item.vendorId)?.vendor.name 
                  : null;

                return (
                  <button
                    key={material.id}
                    type="button"
                    id={`order-material-${material.id}`}
                    onClick={() => openEditor(material.id)}
                    aria-pressed={active}
                    className={`flex min-h-12 touch-manipulation flex-col items-start justify-center rounded-xl border px-2.5 py-2 text-left transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : complete
                          ? "border-primary/40 bg-primary-soft/50 text-foreground"
                          : partial
                            ? "border-border bg-surface text-foreground"
                            : "border-border bg-background text-foreground hover:border-primary/35 hover:bg-primary-soft/30"
                    }`}
                  >
                    <span
                      className={`w-full truncate text-base font-semibold tracking-[-0.01em] ${
                        active ? "text-primary-foreground" : "text-foreground"
                      }`}
                      title={material.name}
                    >
                      {material.name}
                    </span>
                    {complete ? (
                      <span
                        className={`mt-0.5 w-full truncate text-sm font-semibold tabular-nums ${
                          active ? "text-primary-foreground/90" : "text-primary"
                        }`}
                      >
                        {item.unitQty} {item.unitName}{vendorName ? ` ${vendorName}` : ""}
                      </span>
                    ) : partial ? (
                      <span
                        className={`mt-0.5 text-sm font-medium ${
                          active ? "text-primary-foreground/80" : "text-muted"
                        }`}
                      >
                        {item.unitQty} · need unit
                      </span>
                    ) : null}
                    {item.notes ? (
                      <span className={`mt-0.5 w-full truncate text-xs ${active ? "text-primary-foreground/70" : "text-muted"}`}>
                        Note: {item.notes}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {editingMaterial && editingItem ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${editingMaterial.name}`}
            className="absolute inset-x-2 top-2 z-20 rounded-2xl border border-border bg-background p-3.5 shadow-lg sm:inset-x-3 sm:top-3 sm:p-4 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-[calc(100%-2rem)] lg:max-w-2xl lg:shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-[-0.02em] text-foreground">
                  {editingMaterial.name}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  Set quantity and unit, then tap Done.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {(hasQty(editingItem) ||
                  editingItem.unitName.trim() !== "") && (
                  <button
                    type="button"
                    onClick={clearEditingMaterial}
                    className="inline-flex min-h-12 touch-manipulation items-center rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeEditor}
                  className="inline-flex min-h-12 touch-manipulation items-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
                >
                  <Check className="size-5" strokeWidth={2.25} aria-hidden />
                  Done
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,11rem)_minmax(12rem,14rem)_minmax(0,1fr)] sm:items-end">
              <div className="min-w-0">
                <label
                  htmlFor={`edit-vendor-${editingMaterial.id}`}
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Vendor
                </label>
                {editingMaterial.rawMaterialVendors.length === 0 ? (
                  <p className="flex min-h-12 items-center rounded-xl border border-border bg-surface px-3 text-base text-muted">
                    No vendor
                  </p>
                ) : editingMaterial.rawMaterialVendors.length === 1 ? (
                  <p className="flex min-h-12 items-center truncate rounded-xl border border-border bg-background px-3 text-base font-medium text-primary">
                    {editingMaterial.rawMaterialVendors[0].vendor.name}
                  </p>
                ) : (
                  <select
                    id={`edit-vendor-${editingMaterial.id}`}
                    value={editingItem.vendorId ?? ""}
                    onChange={(event) =>
                      onUpdate(editingMaterial.id, {
                        vendorId: Number(event.target.value),
                      })
                    }
                    className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                  >
                    {editingMaterial.rawMaterialVendors.map((rmv) => (
                      <option key={rmv.vendor.id} value={rmv.vendor.id}>
                        {rmv.vendor.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="min-w-0">
                <label
                  htmlFor={`edit-qty-${editingMaterial.id}`}
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Quantity
                </label>
                <QtyStepper
                  key={editingMaterial.id}
                  id={`edit-qty-${editingMaterial.id}`}
                  value={editingItem.unitQty}
                  autoFocus
                  aria-label={`Quantity for ${editingMaterial.name}`}
                  onChange={(unitQty) =>
                    onUpdate(editingMaterial.id, { unitQty })
                  }
                />
              </div>

              <div className="min-w-0">
                <p className="mb-1.5 text-sm font-medium text-foreground">Unit</p>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_UNITS.map((unit) => {
                    const selected = editingItem.unitName === unit;
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() =>
                          onUpdate(editingMaterial.id, { unitName: unit })
                        }
                        className={`inline-flex min-h-12 touch-manipulation items-center rounded-xl border px-3.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-foreground hover:bg-surface"
                        }`}
                      >
                        {unit}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="min-w-0 sm:col-span-3 mt-2">
                <label
                  htmlFor={`edit-notes-${editingMaterial.id}`}
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Notes (e.g. high tea)
                </label>
                <input
                  id={`edit-notes-${editingMaterial.id}`}
                  type="text"
                  value={editingItem.notes ?? ""}
                  onChange={(e) => onUpdate(editingMaterial.id, { notes: e.target.value })}
                  placeholder="Any special instructions for the vendor..."
                  className="w-full min-h-12 rounded-xl border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
