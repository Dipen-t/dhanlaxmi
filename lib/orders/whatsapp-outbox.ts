import { createHash, randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderWhatsappMessages as messages, rawMaterials, vendors } from "@/db/schema";
import { sendWhatsAppPlainText, sendWhatsAppTemplateMessage } from "@/lib/whatsapp";
import { normalizeWhatsAppHubPhone } from "@/lib/whatsapp-phone";
import { groupMaterialsByVendorTiming, vendorScheduleLabel } from "./vendor-timing";
import { menuNotificationChanged, planCustomerNotifications, planVendorChanges, vendorTemplateParams, type NotificationOrder } from "./notification-plan";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Message = typeof messages.$inferSelect;
type Draft = Omit<typeof messages.$inferInsert, "dedupeKey">;
let ready: Promise<void> | null = null;

export function ensureWhatsappOutbox() {
  ready ??= db.execute(sql`CREATE TABLE IF NOT EXISTS order_whatsapp_messages (
    id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    recipient_kind text NOT NULL, vendor_id integer REFERENCES vendors(id) ON DELETE SET NULL,
    recipient_name text NOT NULL, phone text NOT NULL, kind text NOT NULL, payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'queued', last_error text, attempts integer NOT NULL DEFAULT 0,
    attempt_token text, dedupe_key text NOT NULL UNIQUE,
    created_at timestamp NOT NULL DEFAULT now(), updated_at timestamp NOT NULL DEFAULT now()
  )`).then(() => undefined).catch(error => { ready = null; throw error; });
  return ready;
}

async function insertDrafts(transaction: Transaction, drafts: Draft[]) {
  if (!drafts.length) return [];
  const revision = randomUUID();
  return transaction.insert(messages).values(drafts.map(draft => ({ ...draft, dedupeKey: createHash("sha256").update(JSON.stringify([revision, draft])).digest("hex") }))).returning({ id: messages.id });
}

export async function queueCustomerNotifications(transaction: Transaction, before: NotificationOrder | null, next: NotificationOrder) {
  if (before && !menuNotificationChanged(before, next)) return [];
  await transaction.select({ id: orders.id }).from(orders).where(eq(orders.id, next.id)).for("update");
  await transaction.update(messages).set({ status: "superseded", updatedAt: new Date() }).where(and(eq(messages.orderId, next.id), inArray(messages.recipientKind, ["customer", "manager"]), inArray(messages.status, ["queued", "failed", "unknown"])));
  return insertDrafts(transaction, planCustomerNotifications(before, next));
}

export async function queueVendorNotifications(transaction: Transaction, before: NotificationOrder | null, next: NotificationOrder) {
  const plan = planVendorChanges(before, next);
  const affected = [...new Set([...plan.updates, ...plan.removed].map(group => group.vendorId))];
  if (!affected.length) return { ids: [] as { id: number }[], warnings: [] as string[] };
  const contacts = await transaction.query.vendors.findMany({ where: inArray(vendors.id, affected) });
  const materialIds = [...new Set([...(before?.rawMaterials || []), ...next.rawMaterials].map(item => item.rawMaterialId))];
  const items = materialIds.length ? await transaction.query.rawMaterials.findMany({ where: inArray(rawMaterials.id, materialIds) }) : [];
  const names = new Map(items.map(item => [item.id, item.name]));
  await transaction.update(messages).set({ status: "superseded", updatedAt: new Date() }).where(and(eq(messages.orderId, next.id), inArray(messages.vendorId, affected), inArray(messages.status, ["queued", "failed", "unknown"])));
  const drafts: Draft[] = [];
  const warnings: string[] = [];
  const customerPhone = normalizeWhatsAppHubPhone(next.customerPhone ?? "");
  for (const group of groupMaterialsByVendorTiming(next.rawMaterials, next.mealType).filter(group => affected.includes(group.vendorId))) {
    const vendor = contacts.find(contact => contact.id === group.vendorId);
    if (!vendor) continue;
    const matchesCustomer = customerPhone !== null && customerPhone === normalizeWhatsAppHubPhone(vendor.phone);
    drafts.push({ orderId: next.id, recipientKind: "vendor", vendorId: vendor.id, recipientName: vendor.name, phone: vendor.phone, kind: before ? "vendor_update" : "vendor_order",
      payload: { mode: "template", template: process.env.WHATSAPP_ORDER_TEMPLATE?.trim() || "order_alert_final", params: vendorTemplateParams(next, group.timing, group.items, names, vendor.deliveryLocation === "godown" ? "Godown" : next.venue, before !== null) },
      status: matchesCustomer ? "failed" : "queued", lastError: matchesCustomer ? "Vendor and customer have the same phone number. Correct the vendor contact before retrying." : null });
  }
  for (const group of plan.removed) {
    const vendor = contacts.find(contact => contact.id === group.vendorId);
    if (!vendor || !before) continue;
    const detail = `Contact ${vendor.name} (${vendor.phone}) manually: cancel the previous assignment for ${group.items.map(item => names.get(item.rawMaterialId) || "Kitchen item").join(", ")} at ${vendorScheduleLabel(before.date, group.timing)}, ${vendor.deliveryLocation === "godown" ? "Godown" : before.venue}. No automatic cancellation was sent.`;
    warnings.push(detail);
    drafts.push({ orderId: next.id, recipientKind: "vendor", vendorId: vendor.id, recipientName: vendor.name, phone: vendor.phone, kind: "vendor_removed", payload: { mode: "manual", text: detail }, status: "manual_required", lastError: detail });
  }
  return { ids: await insertDrafts(transaction, drafts), warnings };
}

async function recoverInterrupted() {
  await db.update(messages).set({ status: "unknown", lastError: "Sending was interrupted. The provider may already have accepted it; retry can duplicate the message.", updatedAt: new Date() })
    .where(and(eq(messages.status, "sending"), lt(messages.updatedAt, new Date(Date.now() - 60_000))));
}

async function claim(orderId: number, onlyIds?: number[]) {
  return db.transaction(async transaction => {
    const [order] = await transaction.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) return null;
    const running = await transaction.select({ id: messages.id }).from(messages).where(and(eq(messages.orderId, orderId), eq(messages.status, "sending"))).limit(1);
    if (running.length) return null;
    const [message] = await transaction.select().from(messages).where(and(eq(messages.orderId, orderId), eq(messages.status, "queued"), onlyIds ? inArray(messages.id, onlyIds) : undefined)).orderBy(asc(messages.id)).limit(1).for("update");
    if (!message) return null;
    const [claimed] = await transaction.update(messages).set({ status: "sending", attempts: sql`${messages.attempts} + 1`, attemptToken: randomUUID(), updatedAt: new Date(), lastError: null }).where(eq(messages.id, message.id)).returning();
    return claimed;
  });
}

export async function dispatchOrderMessages(orderId: number, onlyIds?: number[], transport = deliver) {
  await ensureWhatsappOutbox();
  await recoverInterrupted();
  if (onlyIds && !onlyIds.length) return;
  for (let count = 0; count < 100; count++) {
    const message = await claim(orderId, onlyIds);
    if (!message) return;
    let result: { success: true } | { error: string };
    try { result = await transport(message); } catch { result = { error: "The send was interrupted; delivery is unknown." }; }
    const error = "error" in result ? result.error.slice(0, 1500) : null;
    const unknown = error !== null && /Fetch Error|interrupted|timeout|aborted/i.test(error);
    await db.update(messages).set({ status: error ? unknown ? "unknown" : "failed" : "accepted", lastError: error, updatedAt: new Date() }).where(and(eq(messages.id, message.id), eq(messages.status, "sending"), eq(messages.attemptToken, message.attemptToken!)));
  }
}

async function deliver(message: Message) {
  const phone = normalizeWhatsAppHubPhone(message.phone);
  if (!phone) return { error: "Invalid recipient number. Correct the saved customer/vendor phone, then retry." };
  if (message.recipientKind === "vendor") {
    const [order] = await db.select({ phone: orders.customerPhone }).from(orders).where(eq(orders.id, message.orderId));
    if (phone === normalizeWhatsAppHubPhone(order?.phone ?? "")) return { error: "Vendor phone matches the customer. Correct the vendor phone before retrying." };
  }
  const payload = message.payload;
  if (payload.mode === "text") return sendWhatsAppPlainText(phone, payload.text || "");
  if (payload.mode === "template") return sendWhatsAppTemplateMessage({ phone, template: payload.template || "", params: payload.params || [] });
  return { error: "This entry requires manual contact; no WhatsApp cancellation template is configured." };
}

export async function getOrderMessages(orderId: number) {
  await ensureWhatsappOutbox();
  await recoverInterrupted();
  const rows = await db.select().from(messages).where(eq(messages.orderId, orderId)).orderBy(desc(messages.id));
  return rows.map(row => ({ id: row.id, orderId: row.orderId, recipientKind: row.recipientKind, recipientName: row.recipientName, vendorId: row.vendorId, phone: row.phone, kind: row.kind, payload: row.payload, status: row.status, lastError: row.lastError, attempts: row.attempts, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
}

export async function retryOrderMessage(orderId: number, messageId: number, acknowledgeUnknown: boolean, transport = deliver) {
  await ensureWhatsappOutbox();
  await recoverInterrupted();
  const result = await db.transaction(async transaction => {
    await transaction.select({ id: orders.id }).from(orders).where(eq(orders.id, orderId)).for("update");
    const [message] = await transaction.select().from(messages).where(and(eq(messages.id, messageId), eq(messages.orderId, orderId))).for("update");
    if (!message || !["failed", "unknown", "queued"].includes(message.status)) return { error: "This message cannot be retried. Refresh its status." };
    if (message.status === "unknown" && !acknowledgeUnknown) return { error: "Confirm that retrying an unknown delivery may send a duplicate." };
    let phone = message.phone;
    if (message.recipientKind === "customer") {
      const [order] = await transaction.select({ phone: orders.customerPhone }).from(orders).where(eq(orders.id, orderId));
      phone = order?.phone ?? "";
    } else if (message.vendorId) {
      const [vendor] = await transaction.select({ phone: vendors.phone }).from(vendors).where(eq(vendors.id, message.vendorId));
      phone = vendor?.phone ?? "";
    }
    await transaction.update(messages).set({ phone, status: "queued", lastError: null, updatedAt: new Date() }).where(eq(messages.id, messageId));
    return { success: true };
  });
  if (result.error) return result;
  await dispatchOrderMessages(orderId, [messageId], transport);
  return { success: true };
}

export async function acknowledgeManualMessage(orderId: number, id: number) {
  await ensureWhatsappOutbox();
  await db.update(messages).set({ status: "acknowledged", updatedAt: new Date() }).where(and(eq(messages.orderId, orderId), eq(messages.id, id), eq(messages.status, "manual_required")));
}

export async function getMessageAttentionCounts(orderIds: number[]) {
  await ensureWhatsappOutbox();
  if (!orderIds.length) return new Map<number, number>();
  const rows = await db.select({ orderId: messages.orderId, count: sql<number>`count(*)::integer` }).from(messages).where(and(inArray(messages.orderId, orderIds), inArray(messages.status, ["queued", "sending", "failed", "unknown", "manual_required"]))).groupBy(messages.orderId);
  return new Map(rows.map(row => [row.orderId, row.count]));
}
