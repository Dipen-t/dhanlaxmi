"use client";

import { Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { deleteMenu, type MenuSummary } from "@/app/menus/actions";

// Lazy-load PDF/WhatsApp controls so /menus doesn't pull that stack into the
// first Termux compile of the list page (Sharp/image tooling is fragile there).
const MenuPdfDownload = dynamic(
  () =>
    import("@/components/menus/menu-pdf-download").then(
      (mod) => mod.MenuPdfDownload,
    ),
  { ssr: false },
);
const MenuWhatsappShare = dynamic(
  () =>
    import("@/components/menus/menu-whatsapp-share").then(
      (mod) => mod.MenuWhatsappShare,
    ),
  { ssr: false },
);

type MenuActionsProps = {
  menu: MenuSummary;
  onEdit: (menu: MenuSummary) => void;
  layout?: "inline" | "stacked";
};

export function MenuActions({
  menu,
  onEdit,
  layout = "inline",
}: MenuActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  function openDeleteDialog() { setDeleteOpen(true); }

  async function handleDelete() {
    const formData = new FormData();
    formData.set("id", String(menu.id));
    return deleteMenu(formData);
  }

  const secondaryClass =
    "inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  const editClass =
    "inline-flex min-h-11 touch-manipulation items-center justify-center gap-1.5 rounded-lg border border-primary/25 bg-primary-soft px-3 text-primary transition-colors hover:border-primary/40 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

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
        <MenuWhatsappShare
          menuId={menu.id}
          menuName={menu.name}
          variant="icon"
          className="contents"
          buttonClassName={secondaryClass}
        />
        <MenuPdfDownload
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
          title={`Edit ${menu.name}`}
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
          title={`Delete ${menu.name}`}
          className={`${deleteClass}${layout === "stacked" ? " min-w-11 flex-1" : " min-w-11"}`}
        >
          <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
          {layout === "stacked" ? (
            <span className="text-sm font-medium">Delete</span>
          ) : null}
        </button>
      </div>

      <DeleteConfirmation
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete menu?"
        message={`Delete "${menu.name}"? This cannot be undone.`}
        action={handleDelete}
        successMessage="Menu deleted"
      />
    </>
  );
}

export function MenuStats({
  categoryCount,
  dishCount,
}: {
  categoryCount: number;
  dishCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center rounded-md bg-primary-soft px-2.5 py-1 text-sm font-medium text-primary">
        {categoryCount} {categoryCount === 1 ? "category" : "categories"}
      </span>
      <span className="inline-flex items-center rounded-md bg-surface px-2.5 py-1 text-sm font-medium text-muted">
        {dishCount} dishes
      </span>
    </div>
  );
}
