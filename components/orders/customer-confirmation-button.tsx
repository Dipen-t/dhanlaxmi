"use client";

import { MessageCircle } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { OrderRecord } from "@/app/orders/actions";
import { shareOrderViaWhatsApp } from "@/app/orders/whatsapp-actions";
import { normalizeWhatsAppHubPhone } from "@/lib/whatsapp-phone";
import { BOOKING_MANAGER_NAME, BOOKING_MANAGER_PHONE } from "@/lib/whatsapp-booking-config";

export function CustomerConfirmationButton({ order, className }: { order: OrderRecord; className: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const phone = normalizeWhatsAppHubPhone(order.customerPhone ?? "");
  const titleId = useId();

  function open() {
    setError(phone ? null : "Add a valid customer phone number by editing this order first.");
    setSuccess(false);
    setWarning(null);
    dialogRef.current?.showModal();
  }

  function close() {
    if (!sendingRef.current) dialogRef.current?.close();
  }

  async function send() {
    if (sendingRef.current || !phone) return;
    sendingRef.current = true;
    setSending(true);
    setError(null);
    try {
      const result = await shareOrderViaWhatsApp(order.id);
      if ("error" in result) setError(result.error);
      else { setSuccess(true); setWarning(result.warning ?? null); }
    } catch {
      setError("Could not send the customer confirmation. Please try again.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <>
      <button type="button" onClick={open} className={className} title="Send customer confirmation" aria-label={`Send customer confirmation for ${order.orderId}`}>
        <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden />
      </button>
      <dialog ref={dialogRef} className="app-dialog" aria-labelledby={titleId} onCancel={(event) => { if (sendingRef.current) event.preventDefault(); }}>
        <div className="px-5 pt-5 pb-4">
          <h2 id={titleId} className="text-base font-semibold text-foreground">Send customer confirmation</h2>
          <p className="mt-2 break-words text-sm text-muted">To: {order.customerName || "Customer"}{phone ? ` · ${phone}` : " · No valid phone number"}</p>
          <p className="mt-1 text-sm text-muted">Copy to manager {BOOKING_MANAGER_NAME} · {BOOKING_MANAGER_PHONE}</p>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm text-foreground">
            <p>Your order has been confirmed</p>
            <p>Date: {order.date.split("-").reverse().join("/")}</p>
            <p>Venue: {order.venue}</p>
            <p>Meal: {order.mealType}</p>
            <p>Thankyou</p>
            <p>Dhanlaxmi caterer</p>
          </div>
          {error ? <p role="alert" className="mt-4 text-sm text-error">{error}</p> : null}
          {success ? <p role="status" className="mt-4 text-sm text-primary">{warning ? "Customer confirmation accepted by WhatsApp provider." : `Customer confirmation and manager ${BOOKING_MANAGER_NAME} copy accepted by WhatsApp provider.`}</p> : null}
          {warning ? <p role="alert" className="mt-3 text-sm text-warning">{warning}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" disabled={sending} onClick={close} className="min-h-11 rounded-lg border border-border px-4 text-sm text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{success ? "Close" : "Cancel"}</button>
          {!success ? <button type="button" disabled={sending || !phone} onClick={send} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{sending ? "Sending…" : "Send to customer"}</button> : null}
        </div>
      </dialog>
    </>
  );
}
