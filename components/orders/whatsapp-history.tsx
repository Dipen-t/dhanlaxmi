"use client";

import { useEffect, useRef, useState } from "react";
import { getOrderWhatsappHistory, markVendorContacted, retryOrderWhatsapp } from "@/app/orders/whatsapp-actions";

type History = Awaited<ReturnType<typeof getOrderWhatsappHistory>>;
const statuses: Record<string, string> = { queued: "Pending", sending: "Sending", accepted: "Accepted by provider", failed: "Failed", unknown: "Delivery unknown", superseded: "Replaced by newer edit", manual_required: "Contact manually", acknowledged: "Contacted manually" };
const kinds: Record<string, string> = { confirmation: "Booking confirmation", selected_menu: "Selected menu text", menu_update: "Updated menu text", vendor_order: "Kitchen instructions", vendor_update: "Updated kitchen instructions", vendor_removed: "Previous assignment removed" };

export function WhatsappHistory({ orderId, refreshKey, onAttention }: { orderId: number; refreshKey: number; onAttention: (count: number) => void }) {
  const [rows, setRows] = useState<History>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const busyRef = useRef(false);
  const [acknowledged, setAcknowledged] = useState<number[]>([]);
  const onAttentionRef = useRef(onAttention);
  useEffect(() => { onAttentionRef.current = onAttention; }, [onAttention]);

  async function refresh() {
    try {
      const next = await getOrderWhatsappHistory(orderId);
      setRows(next);
      onAttentionRef.current(next.filter(row => ["queued", "sending", "failed", "unknown", "manual_required"].includes(row.status)).length);
    } catch { setError("Could not load WhatsApp status. Refresh to try again."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const next = await getOrderWhatsappHistory(orderId);
        if (disposed) return;
        setRows(next);
        setLoading(false);
        onAttentionRef.current(next.filter(row => ["queued", "sending", "failed", "unknown", "manual_required"].includes(row.status)).length);
      } catch { if (!disposed) { setError("Could not load WhatsApp status. Refresh to try again."); setLoading(false); } }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [orderId, refreshKey]);

  async function act(id: number, manual: boolean) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(id); setError("");
    try {
      const result = manual ? await markVendorContacted(orderId, id) : await retryOrderWhatsapp(orderId, id, acknowledged.includes(id));
      if ("error" in result && result.error) setError(result.error);
      await refresh();
    } catch { setError("Could not complete this action. Refresh the status before retrying."); }
    finally { busyRef.current = false; setBusy(null); }
  }

  return (
    <section className="mt-6 border-t border-border pt-4" aria-label="WhatsApp message history">
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">WhatsApp history</h3><button type="button" onClick={() => { setError(""); void refresh(); }} className="min-h-11 rounded-lg px-3 text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Refresh</button></div>
      <p className="text-xs text-muted">Accepted means the provider queued it, not delivered or read. Retry sends only that recipient’s message.</p>
      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
      {loading ? <p className="py-4 text-sm text-muted">Loading status…</p> : !rows.length ? <p className="py-4 text-sm text-muted">No tracked messages yet. Messages sent before this update are not included.</p> : (
        <ul className="mt-3 divide-y divide-border">{rows.map(row => (
          <li key={row.id} className="space-y-2 py-4 text-sm">
            <p className="break-words font-semibold">{row.recipientName} · {row.phone}</p>
            <p className="text-muted">{kinds[row.kind] || row.kind} · {statuses[row.status] || row.status} · {row.attempts} attempt{row.attempts === 1 ? "" : "s"}</p>
            <time className="block text-xs text-muted" dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString("en-IN")}</time>
            {row.lastError ? <p className="break-words text-error">{row.lastError}</p> : null}
            <details><summary className="min-h-11 cursor-pointer py-3 text-primary">View message</summary><pre className="whitespace-pre-wrap break-words text-xs font-sans">{row.payload.text || [row.payload.template, ...(row.payload.params || [])].join("\n")}</pre></details>
            {row.status === "unknown" ? <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={acknowledged.includes(row.id)} onChange={event => setAcknowledged(current => event.target.checked ? [...current, row.id] : current.filter(id => id !== row.id))} className="size-4 accent-primary" /><span>I understand that retrying may send a duplicate.</span></label> : null}
            {["queued", "failed", "unknown"].includes(row.status) ? <button type="button" disabled={busy !== null || (row.status === "unknown" && !acknowledged.includes(row.id))} onClick={() => void act(row.id, false)} className="min-h-11 rounded-lg border border-border px-3 font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{busy === row.id ? "Sending…" : row.status === "queued" ? "Send pending message" : "Retry this recipient"}</button> : null}
            {row.status === "manual_required" ? <button type="button" disabled={busy !== null} onClick={() => void act(row.id, true)} className="min-h-11 rounded-lg border border-border px-3 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">{busy === row.id ? "Saving…" : "Mark contacted manually"}</button> : null}
          </li>
        ))}</ul>
      )}
    </section>
  );
}
