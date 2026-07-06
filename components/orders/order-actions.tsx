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

  const buttonClass =
    "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <>
      <div
        className={
          layout === "stacked"
            ? "flex items-center gap-2"
            : "flex shrink-0 items-center gap-2"
        }
      >
        <button
          type="button"
          onClick={() => onEdit(order)}
          aria-label={`Edit ${order.orderId}`}
          className={buttonClass}
        >
          <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
        <button
          type="button"
          onClick={openDeleteDialog}
          aria-label={`Delete ${order.orderId}`}
          className={buttonClass}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
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
            <p className="mt-2 text-sm text-muted [text-wrap:pretty]">
              Delete &ldquo;{order.orderId}&rdquo;? This cannot be undone.
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
              className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
