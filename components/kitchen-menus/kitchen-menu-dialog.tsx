"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, GripVertical, X } from "lucide-react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  createKitchenMenu,
  updateKitchenMenu,
  type KitchenMenuSummary,
  type KitchenCategoryWithDishes,
} from "@/app/kitchen-menus/actions";

type KitchenMenuDialogProps = {
  open: boolean;
  menu: KitchenMenuSummary | null;
  catalog: KitchenCategoryWithDishes[];
  onClose: () => void;
};

function SortableSelectedDish({
  id,
  name,
  category,
  onRemove,
}: {
  id: number;
  name: string;
  category: string;
  onRemove: () => void;
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex min-h-12 items-center gap-2 rounded-lg border bg-background px-2 ${
        isDragging ? "z-10 border-primary shadow-lg" : "border-border"
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="inline-flex size-11 shrink-0 touch-none items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Drag ${name} to reorder`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" aria-hidden />
      </button>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
        <span className="block truncate text-xs text-muted">{category}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-error-soft hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Remove ${name}`}
      >
        <X className="size-4" aria-hidden />
      </button>
    </li>
  );
}

export function KitchenMenuDialog({ open, menu, catalog, onClose }: KitchenMenuDialogProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [selectedDishIds, setSelectedDishIds] = useState<Set<number>>(new Set());
  const [selectedDishOrder, setSelectedDishOrder] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const isEditing = menu !== null;
  const dishMetaById = useMemo(
    () =>
      new Map(
        catalog.flatMap((category) =>
          category.dishes.map((dish) => [dish.id, { name: dish.name, category: category.name }] as const),
        ),
      ),
    [catalog],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setFormKey((key) => key + 1);
    setError(null);
    const initialQuantities: Record<number, string> = {};
    if (menu?.dishes) {
      menu.dishes.forEach((d) => {
        if (d.quantity) initialQuantities[d.id] = d.quantity;
      });
    }
    setQuantities(initialQuantities);
    const initialDishOrder = menu?.dishes?.map((d) => d.id) ?? [];
    setSelectedDishIds(new Set(initialDishOrder));
    setSelectedDishOrder(initialDishOrder);
    // Expand categories that have selected dishes when editing, or first category if creating
    if (menu?.dishes && menu.dishes.length > 0) {
      const categoriesToExpand = new Set<number>();
      for (const category of catalog) {
        if (category.dishes.some((dish) => menu.dishes.some(md => md.id === dish.id))) {
          categoriesToExpand.add(category.id);
        }
      }
      setExpandedCategories(categoriesToExpand);
    } else if (catalog.length > 0) {
      setExpandedCategories(new Set([catalog[0].id]));
    } else {
      setExpandedCategories(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening / menu changes
  }, [open, menu?.id, catalog]);

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
    // Intentionally only when open toggles; latest onClose is fine for Escape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setError(null);
    onClose();
  }

  function toggleDish(id: number) {
    setSelectedDishIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
        setSelectedDishOrder((order) => order.filter((dishId) => dishId !== id));
      } else {
        next.add(id);
        setSelectedDishOrder((order) => [...order, id]);
      }
      return next;
    });
  }

  function toggleCategoryExpansion(id: number) {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllInCategory(category: KitchenCategoryWithDishes) {
    setSelectedDishIds((current) => {
      const next = new Set(current);
      const allSelected = category.dishes.every((d) => next.has(d.id));
      for (const dish of category.dishes) {
        if (allSelected) {
          next.delete(dish.id);
        } else {
          next.add(dish.id);
        }
      }
      setSelectedDishOrder((order) =>
        allSelected
          ? order.filter((id) => !category.dishes.some((dish) => dish.id === id))
          : [...order, ...category.dishes.map((dish) => dish.id).filter((id) => !next.has(id) || !order.includes(id))],
      );
      return next;
    });
  }

  function clearAll() {
    setSelectedDishIds(new Set());
    setSelectedDishOrder([]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSelectedDishOrder((order) => {
      const oldIndex = order.indexOf(Number(active.id));
      const newIndex = order.indexOf(Number(over.id));
      return oldIndex < 0 || newIndex < 0 ? order : arrayMove(order, oldIndex, newIndex);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setError("Menu name is required.");
      return;
    }

    if (selectedDishIds.size === 0) {
      setError("Select at least one dish.");
      return;
    }

    const dishesArray = selectedDishOrder.filter((id) => selectedDishIds.has(id)).map(id => ({
      id,
      quantity: quantities[id] || undefined,
    }));
    formData.append("dishes", JSON.stringify(dishesArray));

    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateKitchenMenu(formData)
          : await createKitchenMenu(formData);

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

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
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
        className="relative z-10 flex max-h-[min(100dvh,72rem)] w-full max-w-[72rem] flex-col overflow-hidden rounded-t-2xl border border-border bg-background text-foreground shadow-none sm:rounded-xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          maxHeight:
            "min(100dvh - env(safe-area-inset-top, 0px), 72rem)",
        }}
      >
        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-2 [-webkit-overflow-scrolling:touch] sm:px-4">
            <h2
              id={titleId}
              className="text-lg font-semibold text-foreground"
            >
              {isEditing ? "Edit kitchen menu" : "Create kitchen menu"}
            </h2>
            {isEditing ? <input type="hidden" name="id" value={menu.id} /> : null}

            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <input
                  id="menu-name"
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  defaultValue={menu?.name ?? ""}
                  autoComplete="off"
                  enterKeyHint="done"
                  className="col-span-2 min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-ring/30 sm:col-span-6"
                  placeholder="Menu name"
                />
                <input
                  name="venue"
                  type="text"
                  defaultValue={menu?.venue ?? ""}
                  placeholder="Venue"
                  className="col-span-2 sm:col-span-2 min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-ring/30"
                />
                <input
                  name="date"
                  type="date"
                  defaultValue={menu?.date ? new Date(menu.date).toISOString().split('T')[0] : ""}
                  className="col-span-2 sm:col-span-2 min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-ring/30"
                />
                <input
                  name="numberOfPersons"
                  type="number"
                  placeholder="Persons"
                  defaultValue={menu?.numberOfPersons ?? ""}
                  className="sm:col-span-1 min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-ring/30"
                />
                <select
                  name="mealType"
                  defaultValue={menu?.mealType ?? ""}
                  className="sm:col-span-1 min-h-9 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring/30"
                >
                  <option value="">Meal</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>

              {selectedDishOrder.length > 0 ? (
                <section aria-labelledby="selected-dishes-heading" className="rounded-xl border border-border bg-surface/35 p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <h3 id="selected-dishes-heading" className="text-sm font-semibold text-foreground">
                        Selected dish order
                      </h3>
                      <p className="mt-0.5 text-xs text-muted">Drag the handle to set the kitchen menu and PDF order.</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-muted">{selectedDishOrder.length} dishes</span>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={selectedDishOrder} strategy={verticalListSortingStrategy}>
                      <ol className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto overscroll-contain sm:grid-cols-2">
                        {selectedDishOrder.map((dishId) => {
                          const dish = dishMetaById.get(dishId);
                          if (!dish) return null;
                          return (
                            <SortableSelectedDish
                              key={dishId}
                              id={dishId}
                              name={dish.name}
                              category={dish.category}
                              onRemove={() => toggleDish(dishId)}
                            />
                          );
                        })}
                      </ol>
                    </SortableContext>
                  </DndContext>
                </section>
              ) : null}

              <fieldset>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted">
                    {selectedDishIds.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-medium text-muted hover:text-foreground"
                  >
                    Clear All
                  </button>
                </div>

                <div className="mt-1.5 max-h-[min(45rem,75dvh)] space-y-1 overflow-y-auto overscroll-contain rounded-md border border-border p-1 [-webkit-overflow-scrolling:touch]">
                  {catalog.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted">
                      No categories in the catalog yet.
                    </p>
                  ) : (
                    catalog.map((category) => {
                      const selectedCount = category.dishes.filter((d) => selectedDishIds.has(d.id)).length;
                      const allSelected = selectedCount === category.dishes.length && category.dishes.length > 0;
                      const isExpanded = expandedCategories.has(category.id);

                      return (
                        <div key={category.id} className="rounded border border-border overflow-hidden">
                          <div className="flex items-center justify-between bg-surface/50 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpansion(category.id)}
                              className="flex flex-1 items-center gap-1.5 text-left min-w-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-3 text-muted shrink-0" />
                              ) : (
                                <ChevronRight className="size-3 text-muted shrink-0" />
                              )}
                              <span className="font-semibold text-foreground text-xs truncate">
                                {category.name}
                              </span>
                              <span className="text-[10px] text-muted shrink-0">
                                {selectedCount}/{category.dishes.length}
                              </span>
                            </button>
                            {category.dishes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleAllInCategory(category)}
                                className="text-[10px] font-medium text-primary hover:text-primary/80 shrink-0 ml-1"
                              >
                                {allSelected ? "None" : "All"}
                              </button>
                            )}
                          </div>
                          
                          {isExpanded && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 border-t border-border">
                              {category.dishes.length === 0 ? (
                                <p className="col-span-full px-3 py-2 text-sm text-muted italic">Empty</p>
                              ) : (
                                category.dishes.map((dish) => {
                                  const checked = selectedDishIds.has(dish.id);
                                  return (
                                    <div
                                      key={dish.id}
                                      className={`flex flex-col gap-1.5 px-3 py-2 text-sm border-b sm:border-r border-border/40 hover:bg-surface/50 ${
                                        checked ? "bg-primary-soft/20 font-medium" : "text-foreground"
                                      }`}
                                    >
                                      <label className="flex cursor-pointer items-center gap-1 w-full min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleDish(dish.id)}
                                          className="size-3 rounded-sm border-border text-primary accent-primary shrink-0"
                                        />
                                        <span className="truncate leading-tight">{dish.name}</span>
                                      </label>
                                      {checked && category.isQtyField && (
                                        <input
                                          type="text"
                                          value={quantities[dish.id] || ""}
                                          onChange={(e) => setQuantities(q => ({ ...q, [dish.id]: e.target.value }))}
                                          placeholder="Quantity (e.g. 20 pcs)"
                                          className="w-full mt-1 min-h-8 rounded border border-border px-2.5 text-xs bg-background font-normal placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-ring/30"
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </fieldset>
            </div>

            {error ? (
              <p role="alert" className="mt-2 text-xs font-medium text-error">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-3 py-2 sm:px-4">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex min-h-9 touch-manipulation items-center rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-9 touch-manipulation items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
