"use client";

import { MessageCircle, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { shareMenuViaWhatsApp } from "@/app/menus/actions";

type MenuWhatsappShareProps = {
  menuId: number;
  menuName: string;
  variant?: "icon" | "button";
  className?: string;
  buttonClassName?: string;
};

export function MenuWhatsappShare({
  menuId,
  menuName,
  variant = "icon",
  className = "",
  buttonClassName,
}: MenuWhatsappShareProps) {
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
      if (event.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const text = `Here is the menu for ${menuName}:`;

      const result = await shareMenuViaWhatsApp(menuId, phone, text);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setPhone("");
        window.setTimeout(() => setIsOpen(false), 2000);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPhone("");
    setSuccess(false);
    setError(null);
  };

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
          Share via WhatsApp
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Share ${menuName} via WhatsApp`}
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
                style={{
                  paddingBottom: "env(safe-area-inset-bottom, 0px)",
                }}
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <h2
                    id={titleId}
                    className="text-base font-semibold text-foreground"
                  >
                    Send to WhatsApp
                  </h2>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex size-10 touch-manipulation items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Close dialog"
                  >
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
                  <p className="text-sm text-muted text-pretty">
                    Enter the recipient&apos;s phone number to send them a link to
                    the PDF.
                  </p>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="menu-whatsapp-phone"
                      className="text-sm font-medium text-foreground"
                    >
                      Phone number
                    </label>
                    <input
                      id="menu-whatsapp-phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={isLoading || success}
                      autoComplete="tel"
                      className="min-h-12 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-ring/30"
                    />
                  </div>

                  {error ? (
                    <p className="text-sm font-medium text-error">{error}</p>
                  ) : null}

                  {success ? (
                    <p className="text-sm font-medium text-primary">
                      WhatsApp message sent successfully!
                    </p>
                  ) : null}

                  <div className="mt-1 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="inline-flex min-h-11 touch-manipulation items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || success}
                      className="inline-flex min-h-11 touch-manipulation items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    >
                      {isLoading ? "Sending…" : "Send"}
                    </button>
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
