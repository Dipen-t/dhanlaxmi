"use client";

import { MessageCircle } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { OrderRecord } from "@/app/orders/actions";
import { shareOrderViaWhatsApp } from "@/app/orders/whatsapp-actions";
import { normalizeWhatsAppHubPhone } from "@/lib/whatsapp-phone";
import { BOOKING_MANAGER_NAME, BOOKING_MANAGER_PHONE } from "@/lib/whatsapp-booking-config";
import { WhatsappHistory } from "./whatsapp-history";
import { useRouter } from "next/navigation";

export function CustomerConfirmationButton({ order, className }: { order: OrderRecord; className: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sendingRef = useRef(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [openState, setOpenState] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [liveAttention, setLiveAttention] = useState<number | null>(null);
  const router = useRouter();
  const attention = liveAttention ?? order.whatsappAttention ?? 0;
  const phone = normalizeWhatsAppHubPhone(order.customerPhone ?? "");
  const titleId = useId();

  function open() {
    setError(phone ? null : "Add a valid customer phone number by editing this order first.");
    setSuccess(false);
    setWarning(null);
    setOpenState(true);
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
      if ("error" in result && result.error) setError(result.error);
      else { setSuccess(true); setWarning(result.warning ?? null); }
    } catch {
      setError("Could not send the customer confirmation. Please try again.");
    } finally {
      sendingRef.current = false;
      setSending(false);
      setRefreshKey(current => current + 1);
    }
  }

  return (
    <>
      <button type="button" onClick={open} className={`${className} relative`} title="WhatsApp messages and customer confirmation" aria-label={`WhatsApp for ${order.orderId}${attention ? `: ${attention} need attention` : ""}`}>
        <MessageCircle className="size-4" strokeWidth={1.75} aria-hidden />
        {attention > 0 ? <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-warning px-1 text-center text-[10px] font-semibold text-foreground">{attention}</span> : null}
      </button>
      <dialog ref={dialogRef} className="app-dialog app-dialog-wide" aria-labelledby={titleId} onClose={() => { setOpenState(false); setLiveAttention(null); router.refresh(); }} onCancel={(event) => { if (sendingRef.current) event.preventDefault(); }}>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-5 pb-4">
          <h2 id={titleId} className="text-base font-semibold text-foreground">Order WhatsApp</h2>
          <p className="mt-2 break-words text-sm text-muted">To: {order.customerName || "Customer"}{phone ? ` · ${phone}` : " · No valid phone number"}</p>
          <p className="mt-1 text-sm text-muted">Manager {BOOKING_MANAGER_NAME} · {BOOKING_MANAGER_PHONE} receives the selected menu when dishes are selected. Booking confirmation is sent to the customer.</p>
          <details className="mt-4 border-t border-border pt-2 text-sm text-foreground"><summary className="min-h-11 cursor-pointer py-3 font-medium">Preview customer confirmation</summary>
          <div className="space-y-1">
            <p>Your order has been confirmed</p>
            <p>Date: {order.date.split("-").reverse().join("/")}</p>
            <p>Venue: {order.venue}</p>
            <p>Meal: {order.mealType}</p>
            <p>Thankyou</p>
            <p>Dhanlaxmi caterer</p>
          </div>
          </details>
          {error ? <p role="alert" className="mt-4 text-sm text-error">{error}</p> : null}
          {success ? <p role="status" className="mt-4 text-sm text-primary">Request processed. Check each recipient’s status below.</p> : null}
          {warning ? <p role="alert" className="mt-3 text-sm text-warning">{warning}</p> : null}
          {openState ? <WhatsappHistory orderId={order.id} refreshKey={refreshKey} onAttention={setLiveAttention} /> : null}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-5 py-4">
          <button type="button" disabled={sending} onClick={close} className="min-h-11 rounded-lg border border-border px-4 text-sm text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{success ? "Close" : "Cancel"}</button>
          {!success ? <button type="button" disabled={sending || !phone} onClick={send} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{sending ? "Sending…" : "Send to customer"}</button> : null}
        </div>
      </dialog>
    </>
  );
}
