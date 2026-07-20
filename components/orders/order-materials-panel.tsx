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
  onCommitOrder, // Kept for prop compatibility, but we avoid calling it to prevent rows jumping while inline editing
}: OrderMaterialsPanelProps) {
  const [query, setQuery] = useState("");

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
          <div className="h-full overflow-y-auto overscroll-contain p-2 sm:p-2.5">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(12rem,1fr))]">
              {visibleMaterials.map((material) => {
                const item = selectedById.get(material.id);
                if (!item) return null;

                const complete = isComplete(item);
                const hasVendorDropdown = material.rawMaterialVendors.length > 1;

                return (
                  <div
                    key={material.id}
                    className={`flex flex-col overflow-hidden rounded-xl border transition-colors ${
                      complete
                        ? "border-primary/50 bg-primary-soft/30 shadow-sm"
                        : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    {/* Header */}
                    <div className={`flex items-center justify-between px-2.5 py-1.5 border-b border-border ${complete ? "bg-primary-soft/50" : "bg-surface/50"}`}>
                      <span className="truncate text-sm font-semibold tracking-tight text-foreground" title={material.name}>
                        {material.name}
                      </span>
                    </div>

                    {/* Inputs */}
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={item.unitQty}
                        onChange={(e) => onUpdate(material.id, { unitQty: e.target.value })}
                        className="w-16 min-h-[44px] bg-transparent px-2.5 text-base tabular-nums outline-none focus:bg-background"
                        aria-label={`Quantity for ${material.name}`}
                      />
                      <div className="w-px h-[44px] bg-border shrink-0" />
                      <select
                        value={item.unitName}
                        onChange={(e) => onUpdate(material.id, { unitName: e.target.value })}
                        className="flex-1 min-h-[44px] bg-transparent px-2 text-sm outline-none focus:bg-background truncate"
                        aria-label={`Unit for ${material.name}`}
                      >
                        <option value="" disabled>Unit</option>
                        {PREDEFINED_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vendor */}
                    <div className="border-t border-border">
                      {material.rawMaterialVendors.length === 0 ? (
                        <div className="min-h-[40px] px-2.5 flex items-center text-xs text-muted">
                          No vendor
                        </div>
                      ) : !hasVendorDropdown ? (
                        <div className="min-h-[40px] px-2.5 flex items-center text-xs font-medium text-primary truncate" title={material.rawMaterialVendors[0].vendor.name}>
                          {material.rawMaterialVendors[0].vendor.name}
                        </div>
                      ) : (
                        <select
                          value={item.vendorId ?? ""}
                          onChange={(e) => onUpdate(material.id, { vendorId: Number(e.target.value) })}
                          className="w-full min-h-[40px] bg-transparent px-2 text-xs outline-none focus:bg-background"
                          aria-label={`Vendor for ${material.name}`}
                        >
                          <option value="" disabled>Vendor</option>
                          {material.rawMaterialVendors.map((rmv) => (
                            <option key={rmv.vendor.id} value={rmv.vendor.id}>
                              {rmv.vendor.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
