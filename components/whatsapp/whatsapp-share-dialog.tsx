"use client";

import { MessageCircle, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { openWhatsAppShare } from "@/lib/whatsapp-share";

type WhatsappShareDialogProps = {
  title: string;
  description?: string;
  buildMessage: () => string;
  /** Optional server send; if it fails, wa.me fallback still works. */
  onServerSend?: (phone: string, text: string) => Promise<{ error?: string } | { success: true }>;
  variant?: "icon" | "button";
  buttonLabel?: string;
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
};

export function WhatsappShareDialog({
  title,
  description = "Open WhatsApp with a prefilled message. You can also send via the API when configured.",
  buildMessage,
  onServerSend,
  variant = "icon",
  buttonLabel = "Share via WhatsApp",
  className = "",
  buttonClassName,
  ariaLabel,
}: WhatsappShareDialogProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
    setPhone("");
    setSuccess(false);
    setError(null);
  }

  async function handleOpenWhatsApp() {
    const text = buildMessage();
    openWhatsAppShare(phone || null, text);
  }

  async function handleServerSend(event: React.FormEvent) {
    event.preventDefault();
    if (!onServerSend) {
      await handleOpenWhatsApp();
      return;
    }
    if (!phone.trim()) {
      setError("Enter a phone number, or use Open WhatsApp.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const text = buildMessage();
      const result = await onServerSend(phone.trim(), text);
      if ("error" in result && result.error) {
        setError(`${result.error} You can still use Open WhatsApp below.`);
      } else {
        setSuccess(true);
        window.setTimeout(() => handleClose(), 1600);
      }
    } catch {
      setError("Send failed. Use Open WhatsApp instead.");
    } finally {
      setIsLoading(false);
    }
  }

  const baseClass =
    buttonClassName ??
    "inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className={className}>
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`${baseClass} gap-2 px-4 text-sm font-semibold text-foreground`}
        >
          <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden />
          {buttonLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={ariaLabel ?? buttonLabel}
          className={`${baseClass} min-w-11 px-2`}
        >
          <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      )}

      {mounted && isOpen
        ? createPortal(
            <div className="fixed inset-0 z-200 flex items-end justify-center p-0 sm:items-center sm:p-4">
              <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0 bg-[oklch(0.22_0.02_175/0.45)]"
                onClick={handleClose}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-2xl border border-border bg-background text-foreground sm:rounded-xl"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2 id={titleId} className="text-base font-semibold">
                    {title}
                  </h2>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface"
                    aria-label="Close dialog"
                  >
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                </div>

                <form onSubmit={handleServerSend} className="flex flex-col gap-4 p-5">
                  <p className="text-sm text-muted text-pretty">{description}</p>
                  <div className="space-y-1.5">
                    <label htmlFor={`${titleId}-phone`} className="text-sm font-medium">
                      Phone number (optional for Open WhatsApp)
                    </label>
                    <input
                      id={`${titleId}-phone`}
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isLoading || success}
                      autoComplete="tel"
                      className="min-h-12 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  {error ? <p className="text-sm font-medium text-error">{error}</p> : null}
                  {success ? (
                    <p className="text-sm font-medium text-primary">WhatsApp message sent.</p>
                  ) : null}

                  <div className="mt-1 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      disabled={isLoading || success}
                      className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface disabled:opacity-50"
                    >
                      Open WhatsApp
                    </button>
                    {onServerSend ? (
                      <button
                        type="submit"
                        disabled={isLoading || success}
                        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        {isLoading ? "Sending…" : "Send via API"}
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
