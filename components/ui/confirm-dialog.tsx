"use client";

import { AlertTriangle, X } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-background shadow-2xl border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex gap-4">
            <div className={`shrink-0 flex items-center justify-center size-10 rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle className="size-5" />
            </div>
            <div className="pt-1 text-left">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {title}
              </h3>
              <p className="text-sm text-muted">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-background border border-border hover:bg-surface hover:text-foreground transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
              isDestructive 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
