"use client";

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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  reorderMenuCategories,
  type MenuDetail,
} from "@/app/menus/actions";
import { MenuPdfDownload } from "@/components/menus/menu-pdf-download";
import { MenuWhatsappShare } from "@/components/menus/menu-whatsapp-share";
import { WhatsappShareDialog } from "@/components/whatsapp/whatsapp-share-dialog";
import { buildCategoryStallShareText } from "@/lib/whatsapp-share";
import { sendCategoryWhatsApp } from "@/app/menus/whatsapp-actions";

type MenuDetailViewProps = {
  menu: MenuDetail;
};

function categorySectionId(id: number) {
  return `menu-category-${id}`;
}

function SortableCategoryCard({
  id,
  name,
  dishCount,
  selectionRule,
  selected,
  onToggle,
}: {
  id: number;
  name: string;
  dishCount: number;
  selectionRule: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative flex min-h-[7.5rem] flex-col rounded-xl border p-3 transition-colors ${
        isDragging
          ? "z-10 border-primary bg-background shadow-lg"
          : selected
            ? "border-primary bg-primary-soft/40"
            : "border-border bg-background hover:border-primary/40 hover:bg-surface/60"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="inline-flex size-9 shrink-0 touch-none items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Drag ${name} to reorder`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <span
          className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-transparent"
          }`}
          aria-hidden
        >
          <Check className="size-3.5" strokeWidth={2.5} />
        </span>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className="flex min-h-0 flex-1 flex-col items-start gap-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="line-clamp-2 text-sm font-semibold text-foreground">
          {name}
        </span>
        <span className="mt-auto pt-2 text-xs text-muted">
          {dishCount} dish{dishCount === 1 ? "" : "es"} · {selectionRule}
        </span>
      </button>
    </div>
  );
}

export function MenuDetailView({ menu }: MenuDetailViewProps) {
  const [orderedIds, setOrderedIds] = useState(() =>
    menu.categories.map((category) => category.id),
  );
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    menu.categories.map((category) => category.id),
  );
  const [activeJumpId, setActiveJumpId] = useState<number | null>(
    menu.categories[0]?.id ?? null,
  );
  const [isPending, startTransition] = useTransition();

  const categoryById = useMemo(
    () => new Map(menu.categories.map((category) => [category.id, category])),
    [menu.categories],
  );

  const orderedCategories = useMemo(
    () =>
      orderedIds
        .map((id) => categoryById.get(id))
        .filter((category): category is MenuDetail["categories"][number] =>
          Boolean(category),
        ),
    [orderedIds, categoryById],
  );

  const selectedCategories = useMemo(
    () => orderedCategories.filter((category) => selectedIds.includes(category.id)),
    [orderedCategories, selectedIds],
  );

  const dishTotal = orderedCategories.reduce(
    (sum, category) => sum + category.dishes.length,
    0,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const nextIds = menu.categories.map((category) => category.id);
    setOrderedIds(nextIds);
    setSelectedIds((prev) => {
      const retained = prev.filter((id) => nextIds.includes(id));
      return retained.length > 0 ? retained : nextIds;
    });
    setActiveJumpId(nextIds[0] ?? null);
  }, [menu.categories]);

  useEffect(() => {
    const sections = orderedIds
      .map((id) => document.getElementById(categorySectionId(id)))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top?.target.id) return;
        const id = Number(top.target.id.replace("menu-category-", ""));
        if (Number.isFinite(id)) setActiveJumpId(id);
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [orderedIds]);

  function toggle(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function selectAll() {
    setSelectedIds(orderedIds);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function scrollToCategory(id: number) {
    const el = document.getElementById(categorySectionId(id));
    if (!el) return;
    setActiveJumpId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(Number(active.id));
    const newIndex = orderedIds.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const nextIds = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(nextIds);

    startTransition(async () => {
      const result = await reorderMenuCategories(menu.id, nextIds);
      if (result.error) {
        toast.error(result.error);
        setOrderedIds(menu.categories.map((category) => category.id));
        return;
      }
      toast.success("Category order saved");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-20 -mx-4 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base text-muted text-pretty">
              {orderedCategories.length}{" "}
              {orderedCategories.length === 1 ? "category" : "categories"} ·{" "}
              {dishTotal} dishes · preview for sharing
              {isPending ? " · saving order…" : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <MenuWhatsappShare
                menuId={menu.id}
                menuName={menu.name}
                variant="button"
              />
              <WhatsappShareDialog
                directOnly
                onServerSend={sendCategoryWhatsApp}
                title="Share categories via WhatsApp"
                description="Sends only the selected categories, in the order below, so the manager can arrange stalls at the venue."
                variant="button"
                buttonLabel="Share categories on WhatsApp"
                ariaLabel={`Share selected categories from ${menu.name}`}
                disabled={selectedCategories.length === 0}
                buildMessage={() =>
                  buildCategoryStallShareText({
                    menuName: menu.name,
                    categories: selectedCategories.map((category) => ({
                      name: category.name,
                      dishes: category.dishes.map((dish) => ({ name: dish.name })),
                    })),
                  })
                }
              />
              <MenuPdfDownload
                menuId={menu.id}
                menuName={menu.name}
                variant="button"
              />
            </div>
          </div>

          {orderedCategories.length > 0 ? (
            <nav
              aria-label="Jump to category"
              className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            >
              {orderedCategories.map((category) => {
                const active = activeJumpId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => scrollToCategory(category.id)}
                    className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl border border-border bg-surface/40 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Categories for manager / stall setup
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tap a card to include it in the WhatsApp share. Drag the handle to
              set the order used below and in the message.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear
            </button>
            <span className="text-xs tabular-nums text-muted">
              {selectedCategories.length}/{orderedCategories.length} selected
            </span>
          </div>
        </div>

        {orderedCategories.length === 0 ? (
          <p className="text-sm text-muted">No categories on this menu yet.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {orderedCategories.map((category) => (
                  <SortableCategoryCard
                    key={category.id}
                    id={category.id}
                    name={category.name}
                    dishCount={category.dishes.length}
                    selectionRule={category.selectionRule}
                    selected={selectedIds.includes(category.id)}
                    onToggle={() => toggle(category.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {selectedCategories.length === 0 ? (
          <p className="mt-3 text-xs text-muted">
            Select at least one category before sharing.
          </p>
        ) : null}
      </section>

      <div className="space-y-4">
        {orderedCategories.map((category) => (
          <section
            key={category.id}
            id={categorySectionId(category.id)}
            className="scroll-mt-36 overflow-hidden rounded-xl border border-border bg-background sm:scroll-mt-32"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/60 px-4 py-3 sm:px-5">
              <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground md:text-lg">
                {category.name}
              </h2>
              <span className="rounded-md bg-primary-soft px-2.5 py-1 text-sm font-medium text-primary">
                {category.selectionRule}
              </span>
            </div>
            <ol className="divide-y divide-border">
              {category.dishes.map((dish, index) => (
                <li
                  key={dish.id}
                  className="flex items-start gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-sm font-medium tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-base text-foreground">
                    {dish.name}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
