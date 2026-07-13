"use client";

import { FileDown, Pencil, Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";

import { deleteKitchenMenu, type KitchenMenuSummary } from "@/app/kitchen-menus/actions";
import { KitchenMenuPdfDownload } from "@/components/kitchen-menus/kitchen-menu-pdf-download";

type KitchenMenuActionsProps = {
  menu: KitchenMenuSummary;
  onEdit: (menu: KitchenMenuSummary) => void;
  layout?: "inline" | "stacked";
};

export function KitchenMenuActions({
  menu,
  onEdit,
  layout = "inline",
}: KitchenMenuActionsProps) {
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
    formData.set("id", String(menu.id));

    startTransition(async () => {
      await deleteKitchenMenu(formData);
      closeDeleteDialog();
    });
  }

  const secondaryClass =
    "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  const editClass =
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary-soft px-3 text-primary transition-colors hover:border-primary/40 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  const deleteClass =
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 disabled:opacity-50";

  return (
    <>
      <div
        className={
          layout === "stacked"
            ? "flex w-full flex-wrap items-center gap-2"
            : "flex shrink-0 items-center gap-2"
        }
      >
        <KitchenMenuPdfDownload
          menuId={menu.id}
          menuName={menu.name}
          variant="icon"
          className="contents"
          buttonClassName={secondaryClass}
        />
        <button
          type="button"
          onClick={() => onEdit(menu)}
          aria-label={`Edit ${menu.name}`}
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
          aria-label={`Delete ${menu.name}`}
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
              Delete kitchen menu?
            </h2>
            <p className="mt-2 text-sm text-muted text-pretty">
              Delete &ldquo;{menu.name}&rdquo;? This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
            <button
              type="submit"
              className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-red-200 bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function KitchenMenuStats({
  dishCount,
}: {
  dishCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center rounded-md bg-surface px-2.5 py-1 text-sm font-medium text-muted">
        {dishCount} dishes
      </span>
    </div>
  );
}

// Keep icons available for typecheck if tree-shaken oddly in older builds
void FileDown;
