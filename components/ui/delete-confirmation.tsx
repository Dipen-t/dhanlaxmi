"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DeleteConfirmation({ open, onClose, title, message, action, successMessage }: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  action: () => Promise<{ error?: string; success?: boolean }>;
  successMessage: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  function close() {
    if (busyRef.current) return;
    setError("");
    onClose();
  }

  async function remove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (result.error) { setError(result.error); return; }
      if (!result.success) { setError("Deletion was not confirmed. Refresh the list before trying again."); return; }
      toast.success(successMessage);
      onClose();
      router.refresh();
    } catch {
      setError("Could not confirm deletion. Check your connection and refresh the list before trying again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return <dialog ref={dialog} className="app-dialog" aria-labelledby={titleId} aria-describedby={messageId}
    onCancel={event => { event.preventDefault(); close(); }} onClose={close}>
    <form onSubmit={remove} aria-busy={busy} className="flex min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 space-y-3 overflow-y-auto px-5 pt-5 pb-4">
        <h2 id={titleId} className="text-base font-semibold text-foreground">{title}</h2>
        <p id={messageId} className="text-sm text-muted text-pretty">{message}</p>
        {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-background px-5 py-4">
        <button type="button" autoFocus disabled={busy} onClick={close} className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{busy ? "Deleting…" : "Delete"}</button>
      </div>
    </form>
  </dialog>;
}
