"use client";

import { CirclePlus, Pencil, Trash2, IndianRupee } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import { addExtraPlates, deleteOrder, type OrderRecord } from "@/app/orders/actions";
import { formatCurrency } from "@/lib/utils";

type OrderActionsProps = {
  order: OrderRecord;
  onEdit: (order: OrderRecord) => void;
  onFinance?: (order: OrderRecord) => void;
  layout?: "inline" | "stacked";
};

export function OrderActions({
  order,
  onEdit,
  onFinance,
  layout = "inline",
}: OrderActionsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const extraPlatesDialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [additionalPlates, setAdditionalPlates] = useState("");
  const [extraPlatesError, setExtraPlatesError] = useState<string | null>(null);

  const additionalPlateCount = Number(additionalPlates);
  const currentPlateCount = order.numberOfPersons + order.extraPlates;
  const updatedPlateCount = currentPlateCount + (Number.isSafeInteger(additionalPlateCount) ? additionalPlateCount : 0);
  const updatedTotal = order.perPlateAmount && additionalPlateCount > 0
    ? updatedPlateCount * order.perPlateAmount
    : null;

  function openDeleteDialog() {
    dialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    dialogRef.current?.close();
  }

  function openExtraPlatesDialog() {
    setAdditionalPlates("");
    setExtraPlatesError(null);
    extraPlatesDialogRef.current?.showModal();
  }

  function closeExtraPlatesDialog() {
    extraPlatesDialogRef.current?.close();
    setExtraPlatesError(null);
  }

  function handleAddExtraPlates() {
    if (!Number.isSafeInteger(additionalPlateCount) || additionalPlateCount < 1) {
      setExtraPlatesError("Enter at least 1 extra plate.");
      return;
    }

    const formData = new FormData();
    formData.set("id", String(order.id));
    formData.set("additionalPlates", String(additionalPlateCount));
    setExtraPlatesError(null);

    startTransition(async () => {
      const result = await addExtraPlates(formData);
      if (result.error) {
        setExtraPlatesError(result.error);
        return;
      }
      closeExtraPlatesDialog();
    });
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("id", String(order.id));

    startTransition(async () => {
      await deleteOrder(formData);
      closeDeleteDialog();
    });
  }

  const editClass =
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary-soft px-3 text-primary transition-colors hover:border-primary/40 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  const financeClass =
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-background px-3 text-foreground transition-colors hover:border-primary/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  const extraPlatesClass =
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-info/25 bg-info-soft px-3 text-info transition-colors hover:border-info/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45";

  const deleteClass =
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-error/20 bg-error-soft px-3 text-error transition-colors hover:border-error/30 hover:bg-error-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50";

  return (
    <>
      <div
        className={
          layout === "stacked"
            ? "flex w-full flex-wrap items-center gap-2"
            : "flex shrink-0 items-center gap-2"
        }
      >
        <button
          type="button"
          onClick={() => onEdit(order)}
          aria-label={`Edit ${order.orderId}`}
          className={`${editClass}${layout === "stacked" ? " min-w-11 flex-1" : " min-w-11"}`}
        >
          <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
          {layout === "stacked" ? (
            <span className="text-sm font-medium">Edit</span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={openExtraPlatesDialog}
          disabled={!order.perPlateAmount}
          title={order.perPlateAmount ? "Add extra plates" : "Set a per-plate amount first"}
          aria-label={`Add extra plates to ${order.orderId}`}
          className={`${extraPlatesClass}${layout === "stacked" ? " min-w-32 flex-1" : " min-w-11"}`}
        >
          <CirclePlus className="size-4" strokeWidth={1.75} aria-hidden />
          {layout === "stacked" ? <span className="text-sm font-medium">Extra plates</span> : null}
        </button>
        {onFinance && (
          <button
            type="button"
            onClick={() => onFinance(order)}
            aria-label={`Finance for ${order.orderId}`}
            className={`${financeClass}${layout === "stacked" ? " min-w-11 flex-1" : " min-w-11"}`}
          >
            <IndianRupee className="size-4 text-emerald-600" strokeWidth={1.75} aria-hidden />
            {layout === "stacked" ? (
              <span className="text-sm font-medium">Finance</span>
            ) : null}
          </button>
        )}
        <button
          type="button"
          onClick={openDeleteDialog}
          aria-label={`Delete ${order.orderId}`}
          className={`${deleteClass}${layout === "stacked" ? " min-w-11 flex-1" : " min-w-11"}`}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
          {layout === "stacked" ? (
            <span className="text-sm font-medium">Delete</span>
          ) : null}
        </button>
      </div>

      <dialog
        ref={extraPlatesDialogRef}
        className="app-dialog"
        onClose={() => setExtraPlatesError(null)}
      >
        <form
          method="dialog"
          className="flex flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            handleAddExtraPlates();
          }}
        >
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-base font-semibold text-foreground">Add extra plates</h2>
            <p className="mt-1 text-sm text-muted">
              {order.orderId} currently has {currentPlateCount.toLocaleString("en-IN")} plates.
            </p>

            <label className="mt-4 block text-sm font-medium text-foreground" htmlFor={`extra-plates-${order.id}`}>
              Number of extra plates
            </label>
            <input
              id={`extra-plates-${order.id}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              required
              autoFocus
              value={additionalPlates}
              onChange={(event) => setAdditionalPlates(event.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              placeholder="e.g. 25"
            />

            {additionalPlateCount > 0 && order.perPlateAmount ? (
              <div className="mt-4 rounded-lg border border-info/20 bg-info-soft p-3 text-sm">
                <p className="font-medium text-foreground">
                  New total: {updatedPlateCount.toLocaleString("en-IN")} plates
                </p>
                <p className="mt-1 text-muted">
                  {additionalPlateCount.toLocaleString("en-IN")} × {formatCurrency(order.perPlateAmount)} adds {formatCurrency(additionalPlateCount * order.perPlateAmount)}
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  Updated bill: {formatCurrency(updatedTotal)}
                </p>
              </div>
            ) : null}

            {extraPlatesError ? (
              <p role="alert" className="mt-3 text-sm font-medium text-error">{extraPlatesError}</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={closeExtraPlatesDialog}
              disabled={isPending}
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add plates"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={dialogRef}
        className="app-dialog"
        onClose={closeDeleteDialog}
      >
        <form method="dialog" className="flex flex-col">
          <div className="px-5 pt-5 pb-4">
            <h2 className="text-base font-semibold text-foreground">
              Delete order?
            </h2>
            <p className="mt-2 text-sm text-muted text-pretty">
              Delete &ldquo;{order.orderId}&rdquo; at {order.venue}? This cannot
              be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex min-h-10 items-center rounded-lg border border-error/20 bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
