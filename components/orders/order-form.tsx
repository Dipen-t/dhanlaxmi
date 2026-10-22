"use client";

import {
  Coffee,
  Moon,
  Package,
  Sun,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

import {
  createOrder,
  updateOrder,
  type MealType,
  type OrderRecord,
} from "@/app/orders/actions";
import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import type { CategoryWithDishes, MenuSummary } from "@/app/menus/actions";
import { OrderMenuPanel } from "@/components/orders/order-menu-panel";
import {
  OrderMaterialsPanel,
  type OrderMaterialDraft,
} from "@/components/orders/order-materials-panel";
import { PersonsStepper } from "@/components/orders/persons-stepper";
import { calculateTotalWithExtraPlates } from "@/lib/orders/pricing";

type OrderFormProps = {
  order: OrderRecord | null;
  suggestedOrderId: string;
  rawMaterials: MaterialWithVendor[];
  menus: MenuSummary[];
  menuCatalog: CategoryWithDishes[];
};

type OrderFormSection = "details" | "materials" | "menu";

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
  currentOrder?: number[],
) {
  const completeIds = new Set(
    selected.filter(isMaterialComplete).map((item) => item.rawMaterialId),
  );

  const rank = new Map((currentOrder ?? []).map((id, index) => [id, index]));

  return [...materials]
    .sort((a, b) => {
      const aComplete = completeIds.has(a.id);
      const bComplete = completeIds.has(b.id);
      if (aComplete !== bComplete) return aComplete ? -1 : 1;
      const aRank = rank.get(a.id);
      const bRank = rank.get(b.id);
      if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
      return a.name.localeCompare(b.name);
    })
    .map((material) => material.id);
}

export function OrderForm({
  order,
  suggestedOrderId,
  rawMaterials,
  menus,
  menuCatalog,
}: OrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = order !== null;

  const [mealType, setMealType] = useState<MealType>(order?.mealType ?? "lunch");
  const [activeTab, setActiveTab] = useState<OrderFormSection>("details");
  const initialPlateCount = order?.numberOfPersons ?? 1;
  const [plateCount, setPlateCount] = useState(initialPlateCount);
  const [perPlateAmountDisplay, setPerPlateAmountDisplay] = useState(() => {
    if (order?.perPlateAmount) return order.perPlateAmount.toLocaleString("en-IN");
    if (order?.totalAmount && order.totalAmount % initialPlateCount === 0) {
      return (order.totalAmount / initialPlateCount).toLocaleString("en-IN");
    }
    return "";
  });
  const perPlateAmount = Number(perPlateAmountDisplay.replace(/\D/g, ""));
  const extraPlates = order?.extraPlates ?? 0;
  const totalPlateCount = plateCount + extraPlates;
  const calculatedTotal = calculateTotalWithExtraPlates(plateCount, extraPlates, perPlateAmount);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(order?.menuId ?? null);
  const [selectedMenuDishIds, setSelectedMenuDishIds] = useState<number[]>(order?.menuDishIds ?? []);

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
    orderMaterialsByCompletion(
      rawMaterials,
      selectedMaterials,
      order?.rawMaterials.map((material) => material.rawMaterialId),
    ),
  );

  function refreshMaterialOrder(next = selectedMaterialsRef.current) {
    setOrderedMaterialIds((current) => orderMaterialsByCompletion(rawMaterials, next, current));
  }

  function reorderSelectedMaterials(selectedIds: number[]) {
    setOrderedMaterialIds((current) => [
      ...selectedIds,
      ...current.filter((id) => !selectedIds.includes(id)),
    ]);
  }

  const sortedMaterials = useMemo(() => {
    const byId = new Map(
      rawMaterials.map((material) => [material.id, material]),
    );
    return orderedMaterialIds
      .map((id) => byId.get(id))
      .filter((material): material is MaterialWithVendor => Boolean(material));
  }, [orderedMaterialIds, rawMaterials]);

  function switchTab(tab: OrderFormSection) {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    router.push("/orders");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedById = new Map(selectedMaterials.map((item) => [item.rawMaterialId, item]));
    const itemsToSubmit = orderedMaterialIds
      .map((id) => selectedById.get(id))
      .filter((item): item is OrderMaterialDraft => Boolean(item))
      .filter((item) => item.unitQty.trim() !== "" && item.unitQty !== "0");

    if (itemsToSubmit.some((item) => item.unitName.trim() === "")) {
      setError("Please specify a unit for all selected materials.");
      switchTab("materials");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const rawDiscount = String(formData.get("discount") || "").trim();
    const discountType = String(formData.get("discountType") || "rupees");
    const finalDiscount = rawDiscount ? (discountType === "percentage" ? `${rawDiscount}%` : rawDiscount) : "";

    const data = {
      id: order?.id,
      orderId: String(formData.get("orderId") || ""),
      date: String(formData.get("date") || ""),
      venue: String(formData.get("venue") || ""),
      numberOfPersons: Number(formData.get("numberOfPersons")),
      perPlateAmount,
      mealType,
      discount: finalDiscount,
      customerName: String(formData.get("customerName") || "").trim(),
      customerPhone: String(formData.get("customerPhone") || "").trim(),
      rawMaterials: itemsToSubmit,
      menuId: selectedMenuId,
      menuDishIds: menuCatalog
        .flatMap((category) => category.dishes)
        .map((dish) => dish.id)
        .filter((dishId) => selectedMenuDishIds.includes(dishId)),
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

  const fullScreenMode = activeTab !== "details";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        fullScreenMode
          ? "fixed inset-0 z-40 flex flex-col gap-2 overflow-hidden bg-background px-4 pt-2.5 pb-19 sm:px-6"
          : "flex flex-col gap-5 pb-28"
      }
    >
      <nav aria-label="Order sections" className="shrink-0 rounded-xl border border-border bg-background p-1.5">
        <div className="grid grid-cols-3 gap-1">
          {([
            { id: "details" as const, label: "Details", icon: UserRound },
            { id: "materials" as const, label: "Kitchen items", icon: Package },
            { id: "menu" as const, label: "Menu", icon: UtensilsCrossed },
          ]).map((section) => {
            const Icon = section.icon;
            const selected = activeTab === section.id;
            return (
              <button
                key={section.id}
                type="button"
                aria-current={selected ? "step" : undefined}
                onClick={() => switchTab(section.id)}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface hover:text-foreground"}`}
              >
                <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                <span className="truncate">{section.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {error ? (
        <div
          role="alert"
          className="shrink-0 rounded-lg border border-error/20 bg-error-soft p-4 text-sm text-error"
        >
          {error}
        </div>
      ) : null}

      <div
        hidden={activeTab !== "details"}
        className={activeTab === "details" ? "block" : "hidden"}
      >
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
                Customer Name
              </label>
              <input
                id="customer-name"
                name="customerName"
                type="text"
                required
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

            <div className="min-w-0">
              <label
                htmlFor="order-persons"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {extraPlates > 0 ? "Original plates" : "Number of plates"}
              </label>
              <PersonsStepper
                id="order-persons"
                name="numberOfPersons"
                defaultValue={order?.numberOfPersons ?? 1}
                min={1}
                max={100000}
                label="number of plates"
                onValueChange={setPlateCount}
              />
            </div>

            <div className="min-w-0">
              <div>
                <label
                  htmlFor="order-per-plate-amount"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Per-plate amount
                </label>
                <input
                  id="order-per-plate-amount"
                  type="text"
                  inputMode="numeric"
                  required
                  value={perPlateAmountDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setPerPlateAmountDisplay(raw ? Number(raw).toLocaleString("en-IN") : "");
                  }}
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                  placeholder="e.g. 800"
                />
              </div>
            </div>

            <div className="min-w-0 sm:col-span-2">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/35 px-4 py-3">
                <p className="text-xs font-medium text-muted">Calculated total</p>
                <output
                  htmlFor="order-persons order-per-plate-amount"
                  aria-live="polite"
                  className="mt-1 block text-2xl font-semibold tabular-nums text-foreground"
                >
                  {calculatedTotal === null ? "—" : `₹${calculatedTotal.toLocaleString("en-IN")}`}
                </output>
                <p className="mt-1 text-xs text-muted">
                  {totalPlateCount.toLocaleString("en-IN")} plates
                  {extraPlates > 0 ? ` (${plateCount.toLocaleString("en-IN")} original + ${extraPlates.toLocaleString("en-IN")} extra)` : ""}
                  {" × "}{perPlateAmount > 0 ? `₹${perPlateAmount.toLocaleString("en-IN")}` : "rate required"}
                </p>
              </div>
            </div>

            <div className="min-w-0 sm:max-w-md">
              <div>
                <label
                  htmlFor="order-discount"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Discount (Optional)
                </label>
                <div className="flex w-full items-center rounded-lg border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30 overflow-hidden transition-colors">
                  <input
                    id="order-discount"
                    name="discount"
                    type="text"
                    inputMode="numeric"
                    defaultValue={order?.discount ? (order.discount.includes("%") ? order.discount.replace(/\D/g, "") : Number(order.discount.replace(/\D/g, "")).toLocaleString("en-IN")) : ""}
                    onChange={(e) => {
                      const typeSelect = e.target.closest('.flex')?.querySelector('select[name="discountType"]') as HTMLSelectElement;
                      if (typeSelect?.value === "rupees") {
                        const raw = e.target.value.replace(/\D/g, "");
                        e.target.value = raw ? Number(raw).toLocaleString("en-IN") : "";
                      }
                    }}
                    className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-base text-foreground outline-none placeholder:text-muted"
                    placeholder="Amount"
                  />
                  <div className="w-px h-6 bg-border shrink-0" />
                  <select 
                    name="discountType" 
                    defaultValue={order?.discount?.trim().endsWith("%") ? "percentage" : "rupees"}
                    className="h-full bg-transparent pl-3 pr-2 py-2.5 text-base font-medium text-foreground outline-none border-none focus:ring-0 cursor-pointer"
                  >
                    <option value="rupees">₹ (Rupees)</option>
                    <option value="percentage">% (Percent)</option>
                  </select>
                </div>
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
        hidden={activeTab !== "materials"}
        className={
          activeTab === "materials"
            ? "flex min-h-0 flex-1 flex-col"
            : "hidden"
        }
      >
        <OrderMaterialsPanel
          materials={rawMaterials}
          sortedMaterials={sortedMaterials}
          selectedMaterials={selectedMaterials}
          onUpdate={updateMaterial}
          onCommitOrder={refreshMaterialOrder}
          onReorder={reorderSelectedMaterials}
        />
      </div>

      <div
        hidden={activeTab !== "menu"}
        className={activeTab === "menu" ? "flex min-h-0 flex-1 flex-col" : "hidden"}
      >
        <OrderMenuPanel
          menus={menus}
          catalog={menuCatalog}
          selectedMenuId={selectedMenuId}
          selectedDishIds={selectedMenuDishIds}
          onMenuChange={(menuId) => {
            setSelectedMenuId(menuId);
            setSelectedMenuDishIds([]);
          }}
          onDishChange={setSelectedMenuDishIds}
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

          {activeTab === "details" ? (
            <button
              type="button"
              onClick={() => switchTab("materials")}
              className="inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none"
            >
              Continue to materials (optional)
              <Package className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          ) : activeTab === "materials" ? (
            <>
              <button
                type="button"
                onClick={() => switchTab("details")}
                className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Back to details
              </button>
              <button
                type="button"
                onClick={() => switchTab("menu")}
                className="inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:flex-none"
              >
                Continue to menu (optional)
                <UtensilsCrossed className="ml-2 size-4" strokeWidth={1.75} aria-hidden />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => switchTab("materials")}
                className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Back to kitchen items
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-11 flex-1 touch-manipulation items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:flex-none"
              >
                {isPending ? "Saving…" : isEditing ? "Save changes" : "Create order"}
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
