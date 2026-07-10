"use client";

import { MessageCircle, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { shareMenuViaWhatsApp } from "@/app/menus/actions";

type MenuWhatsappShareProps = {
  menuId: number;
  menuName: string;
  variant?: "icon" | "button";
  className?: string;
};

export function MenuWhatsappShare({
  menuId,
  menuName,
  variant = "icon",
  className = "",
}: MenuWhatsappShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
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
        setTimeout(() => setIsOpen(false), 2000);
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
    "inline-flex min-h-10 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className={className}>
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`${baseClass} gap-2 px-4 text-sm font-medium text-foreground`}
        >
          <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden />
          Share via WhatsApp
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={`Share ${menuName} via WhatsApp`}
          className={`${baseClass} min-w-10 px-2`}
        >
          <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="app-dialog"
        onClose={handleClose}
      >
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-foreground">Send to WhatsApp</h2>
            <button
              onClick={handleClose}
              className="rounded-full p-1 text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close dialog"
            >
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col p-5 gap-4">
            <p className="text-sm text-muted">
              Enter the recipient&apos;s phone number to send them a link to the PDF.
            </p>
            <div className="space-y-1">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading || success}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}

            {success && (
              <p className="text-sm text-green-500 font-medium">WhatsApp message sent successfully!</p>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || success}
                className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
