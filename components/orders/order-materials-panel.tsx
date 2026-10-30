"use client";

import { Check, GripVertical, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  onReorder: (selectedIds: number[]) => void;
};

function SortableMaterialCard({
  id,
  name,
  detail,
  notes,
  active,
  complete,
  partial,
  dragDisabled,
  onEdit,
}: {
  id: number;
  name: string;
  detail?: string;
  notes?: string;
  active: boolean;
  complete: boolean;
  partial: boolean;
  dragDisabled: boolean;
  onEdit: () => void;
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: dragDisabled });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex min-h-16 items-stretch rounded-xl border transition-colors ${
        isDragging
          ? "z-30 border-primary bg-background shadow-lg"
          : active
            ? "border-primary bg-primary text-primary-foreground"
            : complete
              ? "border-primary/40 bg-primary-soft/50 text-foreground"
              : partial
                ? "border-border bg-surface text-foreground"
                : "border-border bg-background text-foreground hover:border-primary/35 hover:bg-primary-soft/30"
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        disabled={dragDisabled}
        className={`inline-flex w-10 shrink-0 touch-none items-center justify-center rounded-l-xl border-r focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
          active ? "border-primary-foreground/25 text-primary-foreground/80" : "border-border text-muted hover:bg-surface hover:text-foreground"
        } ${dragDisabled ? "cursor-default opacity-35" : "cursor-grab active:cursor-grabbing"}`}
        aria-label={`Drag ${name} to reorder`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        id={`order-material-${id}`}
        onClick={onEdit}
        aria-pressed={active}
        className="flex min-w-0 flex-1 touch-manipulation flex-col items-start justify-center px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className={`w-full truncate text-base font-semibold tracking-[-0.01em] ${active ? "text-primary-foreground" : "text-foreground"}`} title={name}>
          {name}
        </span>
        {detail ? (
          <span className={`mt-0.5 w-full truncate text-sm font-semibold tabular-nums ${active ? "text-primary-foreground/90" : complete ? "text-primary" : "text-muted"}`}>
            {detail}
          </span>
        ) : null}
        {notes ? (
          <span className={`mt-0.5 w-full truncate text-xs ${active ? "text-primary-foreground/70" : "text-muted"}`}>
            Note: {notes}
          </span>
        ) : null}
      </button>
    </div>
  );
}

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
  onReorder,
}: OrderMaterialsPanelProps) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const materialIds = sortedMaterials.map((material) => material.id);
    const oldIndex = materialIds.indexOf(Number(active.id));
    const newIndex = materialIds.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(materialIds, oldIndex, newIndex));
  }

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
              editingMaterial ? "pt-52 sm:pt-44" : ""
            }`}
          >
            <p className="mb-2 px-1 text-xs text-muted">
              {query ? "Clear search to rearrange materials." : "Drag the handle on any card to arrange materials."}
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleMaterials.map((material) => material.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-1.5">
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
                  <SortableMaterialCard
                    key={material.id}
                    id={material.id}
                    name={material.name}
                    detail={complete ? `${item.unitQty} ${item.unitName}${vendorName ? ` ${vendorName}` : ""}` : partial ? `${item.unitQty} · need unit` : undefined}
                    notes={item.notes}
                    active={active}
                    complete={complete}
                    partial={partial}
                    dragDisabled={Boolean(query)}
                    onEdit={() => openEditor(material.id)}
                  />
                );
              })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {editingMaterial && editingItem ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${editingMaterial.name}`}
            className="absolute inset-x-2 top-2 z-20 rounded-2xl border border-border bg-background p-3.5 shadow-lg sm:inset-x-3 sm:top-3 sm:p-4"
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
