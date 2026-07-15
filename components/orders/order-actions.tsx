"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";

import { deleteOrder, type OrderRecord } from "@/app/orders/actions";

type OrderActionsProps = {
  order: OrderRecord;
  onEdit: (order: OrderRecord) => void;
  layout?: "inline" | "stacked";
};

export function OrderActions({
  order,
  onEdit,
  layout = "inline",
}: OrderActionsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  function openDeleteDialog() {
    dialogRef.current?.showModal();
  }

  function closeDeleteDialog() {
    dialogRef.current?.close();
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

  const deleteClass =
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-error/20 bg-error-soft px-3 text-error transition-colors hover:border-error/30 hover:bg-error-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-50";

  return (
    <>
      <div
        className={
          layout === "stacked"
            ? "flex w-full items-center gap-2"
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
