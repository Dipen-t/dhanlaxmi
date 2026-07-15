"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
};

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function handleClose() {
    onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="app-dialog"
    >
      <form method="dialog" className="flex flex-col">
        <div className="px-5 pt-5 pb-4">
          <div className="flex gap-4">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                isDestructive
                  ? "bg-error-soft text-error"
                  : "bg-primary-soft text-primary"
              }`}
            >
              <AlertTriangle className="size-5" />
            </div>
            <div className="pt-0.5 text-left">
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1 text-sm text-muted text-pretty">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
              isDestructive
                ? "bg-destructive text-destructive-foreground hover:opacity-90"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </form>
    </dialog>
  );
}
