"use client";

import {
  Coffee,
  Moon,
  Package,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  createOrder,
  updateOrder,
  type MealType,
  type OrderRecord,
} from "@/app/orders/actions";
import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import {
  OrderMaterialsPanel,
  type OrderMaterialDraft,
} from "@/components/orders/order-materials-panel";
import { PersonsStepper } from "@/components/orders/persons-stepper";

type OrderFormProps = {
  order: OrderRecord | null;
  suggestedOrderId: string;
  rawMaterials: MaterialWithVendor[];
};

const mealOptions: {
  value: MealType;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "breakfast", label: "Breakfast", icon: Coffee },
  { value: "lunch", label: "Lunch", icon: Sun },
  { value: "dinner", label: "Dinner", icon: Moon },
];

function isMaterialComplete(item: OrderMaterialDraft) {
  return (
    item.unitQty.trim() !== "" &&
    item.unitQty !== "0" &&
    item.unitName.trim() !== ""
  );
}

function orderMaterialsByCompletion(
  materials: MaterialWithVendor[],
  selected: OrderMaterialDraft[],
) {
  const completeIds = new Set(
    selected.filter(isMaterialComplete).map((item) => item.rawMaterialId),
  );

  return [...materials]
    .sort((a, b) => {
      const aComplete = completeIds.has(a.id);
      const bComplete = completeIds.has(b.id);
      if (aComplete !== bComplete) return aComplete ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((material) => material.id);
}

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
  const [activeTab, setActiveTab] = useState<"details" | "materials">("details");

  const [selectedMaterials, setSelectedMaterials] = useState<OrderMaterialDraft[]>(
    () => {
      return rawMaterials.map((rm) => {
        const existing = order?.rawMaterials?.find(
          (m) => m.rawMaterialId === rm.id,
        );
        const defaultVendorId =
          rm.rawMaterialVendors.length > 0
            ? rm.rawMaterialVendors[0].vendor.id
            : null;

        return {
          rawMaterialId: rm.id,
          unitQty: existing?.unitQty ?? "",
          unitName: existing?.unitName ?? "",
          notes: existing?.notes ?? "",
          vendorId: existing?.vendorId ?? defaultVendorId,
        };
      });
    },
  );

  const selectedMaterialsRef = useRef(selectedMaterials);
  selectedMaterialsRef.current = selectedMaterials;

  const [orderedMaterialIds, setOrderedMaterialIds] = useState<number[]>(() =>
    orderMaterialsByCompletion(rawMaterials, selectedMaterials),
  );

  function refreshMaterialOrder(next = selectedMaterialsRef.current) {
    setOrderedMaterialIds(orderMaterialsByCompletion(rawMaterials, next));
  }

  const sortedMaterials = useMemo(() => {
    const byId = new Map(
      rawMaterials.map((material) => [material.id, material]),
    );
    return orderedMaterialIds
      .map((id) => byId.get(id))
      .filter((material): material is MaterialWithVendor => Boolean(material));
  }, [orderedMaterialIds, rawMaterials]);

  function switchTab(tab: "details" | "materials") {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    router.push("/orders");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const itemsToSubmit = selectedMaterials.filter(
      (item) => item.unitQty.trim() !== "" && item.unitQty !== "0",
    );

    if (itemsToSubmit.length === 0) {
      setError("Please specify a quantity for at least one raw material.");
      switchTab("materials");
      return;
    }

    if (itemsToSubmit.some((item) => item.unitName.trim() === "")) {
      setError("Please specify a unit for all selected materials.");
      switchTab("materials");
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
      totalAmount: String(formData.get("totalAmount") || "").trim(),
      discount: String(formData.get("discount") || "").trim(),
      customerName: String(formData.get("customerName") || "").trim(),
      customerPhone: String(formData.get("customerPhone") || "").trim(),
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

  function updateMaterial(
    rawMaterialId: number,
    updates: Partial<OrderMaterialDraft>,
  ) {
    setSelectedMaterials((prev) => {
      const next = prev.map((item) =>
        item.rawMaterialId === rawMaterialId ? { ...item, ...updates } : item,
      );
      selectedMaterialsRef.current = next;
      return next;
    });
  }

  const materialsMode = activeTab === "materials";

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    
    function updateScrollLock() {
      if (materialsMode && !mql.matches) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }

    updateScrollLock();
    mql.addEventListener("change", updateScrollLock);
    
    return () => {
      mql.removeEventListener("change", updateScrollLock);
      document.body.style.overflow = "";
    };
  }, [materialsMode]);

  return (
    <form
      onSubmit={handleSubmit}
      className={
        materialsMode
          ? "fixed inset-0 z-40 flex flex-col gap-2 overflow-hidden bg-background px-4 pt-2.5 pb-19 sm:px-6 lg:static lg:inset-auto lg:z-auto lg:grid lg:grid-cols-[minmax(320px,400px)_1fr] lg:gap-6 lg:overflow-visible lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-28"
          : "flex flex-col gap-5 pb-28 lg:grid lg:grid-cols-[minmax(320px,400px)_1fr] lg:gap-6"
      }
    >
      {error ? (
        <div
          role="alert"
          className="shrink-0 rounded-lg border border-error/20 bg-error-soft p-4 text-sm text-error lg:col-span-2"
        >
          {error}
        </div>
      ) : null}

      <div className={`${activeTab === "details" ? "block" : "hidden"} lg:block lg:shrink-0`}>
        <div className="rounded-xl border border-border bg-background p-5 sm:p-6">
          <h2 className="mb-5 text-lg font-semibold text-foreground">
            Order details
          </h2>

          {isEditing ? <input type="hidden" name="id" value={order.id} /> : null}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
            <div className="min-w-0">
              <label
                htmlFor="order-id"
                className="mb-1.5 block text-sm font-medium text-foreground"
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
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. ORD-001"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="order-date"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Event date
              </label>
              <input
                id="order-date"
                name="date"
                type="date"
                defaultValue={order?.date ?? ""}
                className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="customer-name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Customer Name (Optional)
              </label>
              <input
                id="customer-name"
                name="customerName"
                type="text"
                maxLength={200}
                defaultValue={order?.customerName ?? ""}
                autoComplete="name"
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="customer-phone"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Customer Phone (Optional)
              </label>
              <input
                id="customer-phone"
                name="customerPhone"
                type="tel"
                maxLength={20}
                defaultValue={order?.customerPhone ?? ""}
                autoComplete="tel"
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="min-w-0 sm:col-span-2">
              <label
                htmlFor="order-venue"
                className="mb-1.5 block text-sm font-medium text-foreground"
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
                className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. Grand Ballroom"
              />
            </div>

            <div className="min-w-0 sm:col-span-2 sm:max-w-md">
              <label
                htmlFor="order-persons"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Number of persons
              </label>
              <PersonsStepper
                id="order-persons"
                name="numberOfPersons"
                defaultValue={order?.numberOfPersons ?? 1}
                min={1}
                max={100000}
              />
            </div>

            <div className="min-w-0 sm:col-span-2 sm:max-w-md grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="order-total-amount"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Total Amount
                </label>
                <input
                  id="order-total-amount"
                  name="totalAmount"
                  type="number"
                  min="0"
                  defaultValue={order?.totalAmount ?? ""}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                  placeholder="e.g. 50000"
                />
              </div>

              <div>
                <label
                  htmlFor="order-discount"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Discount (Optional)
                </label>
                <input
                  id="order-discount"
                  name="discount"
                  type="text"
                  defaultValue={order?.discount ?? ""}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                  placeholder="e.g. 10% or 500"
                />
              </div>
            </div>

            <fieldset className="min-w-0 sm:col-span-2">
              <legend className="mb-2.5 block text-sm font-medium text-foreground">
                Meal type
              </legend>
              <div
                role="radiogroup"
                aria-label="Meal type"
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                {mealOptions.map((option) => {
                  const selected = mealType === option.value;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setMealType(option.value)}
                      className={`inline-flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-16 ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-foreground hover:border-primary/40 hover:bg-primary-soft"
                      }`}
                    >
                      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      <div
        className={
          materialsMode
            ? "flex min-h-0 flex-1 flex-col lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]"
            : "hidden lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:min-h-0 lg:flex-col"
        }
      >
        <OrderMaterialsPanel
          materials={rawMaterials}
          sortedMaterials={sortedMaterials}
          selectedMaterials={selectedMaterials}
          onUpdate={updateMaterial}
          onCommitOrder={refreshMaterialOrder}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 px-4 py-3 backdrop-blur-sm sm:inset-x-auto sm:right-6 sm:bottom-6 sm:rounded-2xl sm:border sm:px-3 sm:py-3 sm:shadow-lg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-2 sm:mx-0">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>

          {activeTab === "details" && (
            <button
              type="button"
              onClick={() => switchTab("materials")}
              className="inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none lg:hidden"
            >
              Continue to materials
              <Package className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          )}

          {activeTab === "materials" && (
            <button
              type="button"
              onClick={() => switchTab("details")}
              className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              Back to details
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={`inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:flex-none ${activeTab === "details" ? "hidden lg:inline-flex" : ""}`}
          >
            {isPending
              ? "Saving…"
              : isEditing
                ? "Save changes"
                : "Create order"}
          </button>
        </div>
      </div>
    </form>
  );
}
