"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  createOrder,
  updateOrder,
  type MealType,
  type OrderRecord,
} from "@/app/orders/actions";

type OrderDialogProps = {
  open: boolean;
  order: OrderRecord | null;
  suggestedOrderId: string;
  onClose: () => void;
};

const mealOptions = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
] as const;

export function OrderDialog({
  open,
  order,
  suggestedOrderId,
  onClose,
}: OrderDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");

  const isEditing = order !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setError(null);
      setMealType(order?.mealType ?? "lunch");
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
    const formData = new FormData(event.currentTarget);
    formData.set("mealType", mealType);

    startTransition(async () => {
      const result = isEditing
        ? await updateOrder(formData)
        : await createOrder(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      handleClose();
    });
  }

  return (
    <dialog ref={dialogRef} onClose={handleClose} className="app-dialog app-dialog-wide">
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="app-dialog-body px-5 pt-5 pb-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Edit order" : "Add order"}
          </h2>
          {isEditing ? <input type="hidden" name="id" value={order.id} /> : null}

          <div className="mt-4 space-y-4">
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
