"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { db } from "@/db";
import {
  dishes,
  orderMenuDishes,
  orders,
  orderRawMaterials,
} from "@/db/schema";
import { calculatePlateTotal, calculateTotalWithExtraPlates } from "@/lib/orders/pricing";
import { eventDateString, parseEventDate } from "@/lib/orders/event-date";
import { HI_TEA_NOTES_LIMIT, normalizeHiTeaNotes } from "@/lib/orders/hi-tea";
import { dispatchOrderMessages, ensureWhatsappOutbox, getMessageAttentionCounts, queueCustomerNotifications, queueVendorNotifications } from "@/lib/orders/whatsapp-outbox";


export type MealType = "breakfast" | "lunch" | "dinner";

export type OrderRawMaterialRecord = {
  rawMaterialId: number;
  unitQty: string;
  unitName: string;
  notes?: string | null;
  timing?: string | null;
  vendorId?: number | null;
  sortOrder?: number;
};

export type OrderMenuDishRecord = {
  dishId: number;
  name: string;
  categoryId: number;
  categoryName: string;
};

export type OrderRecord = {
  id: number;
  orderId: string;
  date: string;
  eventTime: string | null;
  hiTeaNotes?: string | null;
  materialOrder: number[];
  venue: string;
  numberOfPersons: number;
  extraPlates: number;
  perPlateAmount: number | null;
  mealType: MealType;
  totalAmount: number | null;
  discount: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customer2Name: string | null;
  customer2Phone: string | null;
  isPaymentAmount: boolean;
  menuId: number | null;
  menuName: string | null;
  menuDishes: OrderMenuDishRecord[];
  rawMaterials: OrderRawMaterialRecord[];
  dishIds: number[];
  vendors: string[];
  whatsappAttention?: number;
};

function toDateString(date: Date) {
  return eventDateString(date);
}

function serializeOrder(order: {
  id: number;
  orderId: string;
  date: Date;
  eventTime: string | null;
  hiTeaNotes?: string | null;
  materialOrder?: number[] | null;
  venue: string;
  numberOfPersons: number;
  extraPlates: number;
  perPlateAmount: number | null;
  mealType: MealType;
  totalAmount: number | null;
  discount: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customer2Name?: string | null;
  customer2Phone?: string | null;
  isPaymentAmount: boolean;
  menuId?: number | null;
  menu?: { id: number; name: string } | null;
  orderMenuDishes?: {
    dishId: number;
    sortOrder: number;
    dish?: {
      id: number;
      name: string;
      categoryId: number;
      category?: { id: number; name: string } | null;
    } | null;
  }[];
  orderRawMaterials?: {
    rawMaterialId: number;
    unitQty: string;
    unitName: string;
    notes?: string | null;
    timing?: string | null;
    vendorId: number | null;
    sortOrder?: number;
    vendor?: { name: string } | null;
  }[];
}): OrderRecord {
  const vendors = Array.from(new Set((order.orderRawMaterials || [])
    .map(rm => rm.vendor?.name)
    .filter((name): name is string => !!name)));

  const menuDishes: OrderMenuDishRecord[] = (order.orderMenuDishes || [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((row) => {
      if (!row.dish) return [];
      return [{
        dishId: row.dish.id,
        name: row.dish.name,
        categoryId: row.dish.category?.id ?? row.dish.categoryId,
        categoryName: row.dish.category?.name ?? "Menu",
      }];
    });

  return {
    id: order.id,
    orderId: order.orderId,
    date: toDateString(order.date),
    eventTime: order.eventTime,
    hiTeaNotes: order.hiTeaNotes ?? null,
    materialOrder: order.materialOrder ?? (order.orderRawMaterials ?? []).map((material) => material.rawMaterialId),
    venue: order.venue,
    numberOfPersons: order.numberOfPersons,
    extraPlates: order.extraPlates,
    perPlateAmount: order.perPlateAmount,
    mealType: order.mealType,
    totalAmount: order.totalAmount,
    discount: order.discount,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customer2Name: order.customer2Name ?? null,
    customer2Phone: order.customer2Phone ?? null,
    isPaymentAmount: order.isPaymentAmount,
    menuId: order.menuId ?? order.menu?.id ?? null,
    menuName: order.menu?.name ?? null,
    menuDishes,
    rawMaterials: order.orderRawMaterials?.map(rm => ({
      ...rm,
      vendorId: rm.vendorId
    })) ?? [],
    dishIds: order.orderMenuDishes?.map((row) => row.dishId) ?? [],
    vendors,
  };
}

const orderDetailWith = {
  menu: true as const,
  orderMenuDishes: {
    orderBy: [asc(orderMenuDishes.sortOrder)],
    with: {
      dish: {
        with: {
          category: true as const,
        },
      },
    },
  },
  orderRawMaterials: {
    orderBy: [asc(orderRawMaterials.sortOrder)],
    with: {
      vendor: true as const,
    },
  },
};

/** Ascending by event date, then by order number / creation sequence. */
function compareOrdersAscending(a: OrderRecord, b: OrderRecord) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  const aNum = Number(a.orderId.match(/^ORD-(\d+)$/i)?.[1] ?? NaN);
  const bNum = Number(b.orderId.match(/^ORD-(\d+)$/i)?.[1] ?? NaN);
  if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
    return aNum - bNum;
  }
  return a.id - b.id;
}

export async function getOrders(): Promise<OrderRecord[]> {
  const rows = await db.query.orders.findMany({
    orderBy: [asc(orders.date), asc(orders.id)],
    with: orderDetailWith,
  });

  const attention = await getMessageAttentionCounts(rows.map(row => row.id));
  return rows.map(row => ({ ...serializeOrder(row), whatsappAttention: attention.get(row.id) ?? 0 })).sort(compareOrdersAscending);
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return null;
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, numericId),
    with: orderDetailWith,
  });

  return order ? serializeOrder(order) : null;
}

export async function getSuggestedOrderId(): Promise<string> {
  const allOrders = await db.query.orders.findMany({
    columns: { orderId: true },
  });

  let maxNum = 0;
  for (const o of allOrders) {
    const match = o.orderId.match(/^ORD-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `ORD-${String(maxNum + 1).padStart(3, "0")}`;
}

async function allocateUniqueOrderId(preferred: string): Promise<string> {
  const existing = await db.query.orders.findMany({
    columns: { orderId: true },
  });
  const taken = new Set(existing.map((o) => o.orderId.toUpperCase()));
  const preferredKey = preferred.trim();
  if (preferredKey && !taken.has(preferredKey.toUpperCase())) {
    return preferredKey;
  }

  let maxNum = 0;
  for (const o of existing) {
    const match = o.orderId.match(/^ORD-(\d+)$/i);
    if (match) {
      maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  }

  let next = maxNum + 1;
  let candidate = `ORD-${String(next).padStart(3, "0")}`;
  while (taken.has(candidate.toUpperCase())) {
    next += 1;
    candidate = `ORD-${String(next).padStart(3, "0")}`;
  }
  return candidate;
}

function normalizeText(value: string) {
  return value.trim();
}

function validateOrderFields(
  orderId: string,
  date: string,
  venue: string,
  numberOfPersons: number,
  perPlateAmount: number,
  mealType: string,
) {
  if (!orderId) {
    return "Order ID is required.";
  }
  if (orderId.length > 32) {
    return "Order ID must be 32 characters or less.";
  }
  if (!date) {
    return "Event date is required.";
  }
  if (Number.isNaN(Date.parse(date))) {
    return "Enter a valid date.";
  }
  if (!venue) {
    return "Venue is required.";
  }
  if (venue.length > 200) {
    return "Venue must be 200 characters or less.";
  }
  if (!Number.isInteger(numberOfPersons) || numberOfPersons < 1) {
    return "Number of plates must be at least 1.";
  }
  if (numberOfPersons > 100000) {
    return "Number of plates is too large.";
  }
  if (calculatePlateTotal(numberOfPersons, perPlateAmount) === null) {
    return "Enter a valid per-plate amount. The calculated total must be within ₹2,14,74,83,647.";
  }
  if (mealType !== "breakfast" && mealType !== "lunch" && mealType !== "dinner") {
    return "Select a meal type.";
  }
  return null;
}

export type OrderInput = {
  id?: number;
  orderId: string;
  date: string;
  venue: string;
  numberOfPersons: number;
  perPlateAmount: number;
  mealType: string;
  discount?: string;
  customerName?: string;
  customerPhone?: string;
  customer2Name?: string;
  customer2Phone?: string;
  rawMaterials: OrderRawMaterialRecord[];
  dishIds?: number[];
  hiTeaNotes?: string;
  materialOrder?: number[];
};

async function validateDishSelection(dishIds: number[]) {
  if (dishIds.some((dishId) => !Number.isSafeInteger(dishId) || dishId <= 0)) {
    return "One or more selected dishes are invalid.";
  }
  if (dishIds.length === 0) return null;
  const found = await db.query.dishes.findMany({
    where: inArray(dishes.id, dishIds),
    columns: { id: true },
  });
  if (found.length !== dishIds.length) return "One or more selected dishes no longer exist.";
  return null;
}

async function syncOrderMenuDishes(
  orderId: number,
  dishIds: number[],
  transaction: Parameters<Parameters<typeof db.transaction>[0]>[0],
) {
  await transaction.delete(orderMenuDishes).where(eq(orderMenuDishes.orderId, orderId));
  const uniqueIds = [...new Set(dishIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (uniqueIds.length === 0) return;

  const valid = await transaction.query.dishes.findMany({
    where: inArray(dishes.id, uniqueIds),
    columns: { id: true },
  });
  const validIds = new Set(valid.map((d) => d.id));
  const rows = uniqueIds
    .filter((id) => validIds.has(id))
    .map((dishId, index) => ({
      orderId,
      dishId,
      sortOrder: index,
    }));
  if (rows.length > 0) {
    await transaction.insert(orderMenuDishes).values(rows);
  }
}

export async function createOrder(data: OrderInput) {
  const hiTeaNotes = normalizeHiTeaNotes(data.hiTeaNotes);
  if (hiTeaNotes.length > HI_TEA_NOTES_LIMIT) return { error: `Hi-tea notes must be ${HI_TEA_NOTES_LIMIT} characters or fewer.` };
  const preferredOrderId = normalizeText(data.orderId || "");
  const date = data.date || "";
  const venue = normalizeText(data.venue || "");
  const numberOfPersons = Number(data.numberOfPersons);
  const perPlateAmount = Number(data.perPlateAmount);
  const mealType = data.mealType || "";
  const totalAmount = calculatePlateTotal(numberOfPersons, perPlateAmount);
  const discount = data.discount?.trim() || null;
  const customerName = data.customerName?.trim() || null;
  const customerPhone = data.customerPhone?.trim() || null;
  const customer2Name = data.customer2Name?.trim() || null;
  const customer2Phone = data.customer2Phone?.trim() || null;
  const isPaymentAmount = totalAmount !== null && totalAmount > 0;
  const materials = (data.rawMaterials || []).map((material) => ({
    ...material,
    timing: material.timing?.trim() || null,
  }));
  if (materials.some((material) => material.timing && !/^([01]\d|2[0-3]):[0-5]\d$/.test(material.timing))) {
    return { error: "Select a complete delivery timing for each kitchen item, or leave it empty." };
  }
  const materialOrder = data.materialOrder ?? materials.map((material) => material.rawMaterialId);
  if (materialOrder.length > 10000 || new Set(materialOrder).size !== materialOrder.length || materialOrder.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    return { error: "The kitchen item arrangement is invalid. Refresh and try again." };
  }
  const dishIds = [...new Set((data.dishIds || []).map(Number))];

  const orderId = await allocateUniqueOrderId(preferredOrderId);

  const error = validateOrderFields(
    orderId,
    date,
    venue,
    numberOfPersons,
    perPlateAmount,
    mealType,
  );
  if (error) {
    return { error };
  }
  if (totalAmount === null) {
    return { error: "Enter a valid per-plate amount. The calculated total must be within ₹2,14,74,83,647." };
  }
  const uniqueMaterialIds = new Set(materials.map((m) => m.rawMaterialId));
  if (uniqueMaterialIds.size !== materials.length) {
    return { error: "Duplicate raw materials selected. Please remove the duplicates." };
  }
  const dishError = await validateDishSelection(dishIds);
  if (dishError) return { error: dishError };

  for (const m of materials) {
    if (!String(m.unitQty || "").trim() || String(m.unitQty) === "0") {
      return { error: "Each selected material needs a quantity." };
    }
    if (!String(m.unitName || "").trim()) {
      return { error: "Each selected material needs a unit." };
    }
  }

  try {
    const eventDate = parseEventDate(date);

    await ensureWhatsappOutbox();
    const newOrder = await db.transaction(async (transaction) => {
      const [newOrder] = await transaction.insert(orders).values({
        orderId,
        date: eventDate,
        hiTeaNotes: hiTeaNotes || null,
        materialOrder,
        venue,
        numberOfPersons,
        perPlateAmount,
        mealType: mealType as MealType,
        totalAmount,
        discount,
        customerName,
        customerPhone,
        customer2Name,
        customer2Phone,
        isPaymentAmount,
        extraPlates: 0,
      }).returning({ id: orders.id });

      if (materials.length > 0) {
        await transaction.insert(orderRawMaterials).values(
          materials.map((m, index) => ({
            orderId: newOrder.id,
            rawMaterialId: m.rawMaterialId,
            unitQty: String(m.unitQty),
            unitName: String(m.unitName),
            notes: m.notes || null,
            timing: m.timing?.trim() || null,
            vendorId: m.vendorId || null,
            sortOrder: index,
          }))
        );
      }

      await syncOrderMenuDishes(newOrder.id, dishIds, transaction);
      const saved = await transaction.query.orders.findFirst({ where: eq(orders.id, newOrder.id), with: orderDetailWith });
      if (!saved) throw new Error("Order not found");
      const snapshot = serializeOrder(saved);
      await queueCustomerNotifications(transaction, null, snapshot);
      await queueVendorNotifications(transaction, null, snapshot);
      return newOrder;
    });

    revalidatePath("/orders");

    after(async () => { await dispatchOrderMessages(newOrder.id); });
    return { success: true as const, id: newOrder.id, orderId, whatsappQueued: true, whatsappError: undefined, whatsappWarning: undefined };
  } catch (e: unknown) {
    const error = e as { code?: string; message?: string } | null;
    console.error("Error creating order:", e);
    if (error?.code === "23505" || error?.message?.includes("unique constraint") || error?.message?.includes("already exists")) {
      return { error: "An order with this ID already exists. Refresh and try again." };
    }
    return { error: error?.message || "Failed to create order due to an unexpected error." };
  }
}

export async function updateOrder(data: OrderInput) {
  const hiTeaNotes = normalizeHiTeaNotes(data.hiTeaNotes);
  if (hiTeaNotes.length > HI_TEA_NOTES_LIMIT) return { error: `Hi-tea notes must be ${HI_TEA_NOTES_LIMIT} characters or fewer.` };
  const id = Number(data.id);
  const orderId = normalizeText(data.orderId || "");
  const date = data.date || "";
  const venue = normalizeText(data.venue || "");
  const numberOfPersons = Number(data.numberOfPersons);
  const perPlateAmount = Number(data.perPlateAmount);
  const mealType = data.mealType || "";
  const existingOrder = Number.isSafeInteger(id) && id > 0
    ? await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
          orderRawMaterials: true,
        },
      })
    : null;
  const extraPlates = existingOrder?.extraPlates ?? 0;
  const totalAmount = calculateTotalWithExtraPlates(numberOfPersons, extraPlates, perPlateAmount);
  const discount = data.discount?.trim() || null;
  const customerName = data.customerName?.trim() || null;
  const customerPhone = data.customerPhone?.trim() || null;
  const customer2Name = data.customer2Name?.trim() || null;
  const customer2Phone = data.customer2Phone?.trim() || null;
  const materials = (data.rawMaterials || []).map((material) => ({
    ...material,
    timing: material.timing?.trim() || null,
  }));
  if (materials.some((material) => material.timing && !/^([01]\d|2[0-3]):[0-5]\d$/.test(material.timing))) {
    return { error: "Select a complete delivery timing for each kitchen item, or leave it empty." };
  }
  const materialOrder = data.materialOrder ?? materials.map((material) => material.rawMaterialId);
  if (materialOrder.length > 10000 || new Set(materialOrder).size !== materialOrder.length || materialOrder.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    return { error: "The kitchen item arrangement is invalid. Refresh and try again." };
  }
  const dishIds = [...new Set((data.dishIds || []).map(Number))];

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid order." };
  }
  if (!existingOrder) {
    return { error: "Order not found." };
  }

  const error = validateOrderFields(
    orderId,
    date,
    venue,
    numberOfPersons,
    perPlateAmount,
    mealType,
  );
  if (error) {
    return { error };
  }
  if (totalAmount === null) {
    return { error: "The combined original and extra plate count is too large." };
  }

  const uniqueMaterialIds = new Set(materials.map((m) => m.rawMaterialId));
  if (uniqueMaterialIds.size !== materials.length) {
    return { error: "Duplicate raw materials selected. Please remove the duplicates." };
  }
  const dishError = await validateDishSelection(dishIds);
  if (dishError) return { error: dishError };

  try {
    const eventDate = parseEventDate(date);

    await ensureWhatsappOutbox();
    const notifications = await db.transaction(async (transaction) => {
      await transaction.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).for("update");
      const previous = await transaction.query.orders.findFirst({ where: eq(orders.id, id), with: orderDetailWith });
      if (!previous) throw new Error("Order not found");
      const currentTotalAmount = calculateTotalWithExtraPlates(numberOfPersons, previous.extraPlates, perPlateAmount);
      if (currentTotalAmount === null) throw new Error("The combined plate count or amount is too large.");
      const [updated] = await transaction
        .update(orders)
        .set({
          orderId,
          date: eventDate,
          hiTeaNotes: data.hiTeaNotes === undefined ? previous.hiTeaNotes : hiTeaNotes || null,
          materialOrder,
          venue,
          numberOfPersons,
          perPlateAmount,
          mealType: mealType as MealType,
          totalAmount: currentTotalAmount,
          discount,
          customerName,
          customerPhone,
          customer2Name,
          customer2Phone,
          isPaymentAmount: currentTotalAmount > 0,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning({ id: orders.id });

      if (!updated) {
        throw new Error("Order not found");
      }

      await transaction.delete(orderRawMaterials).where(eq(orderRawMaterials.orderId, id));
      if (materials.length > 0) {
        await transaction.insert(orderRawMaterials).values(
          materials.map((m, index) => ({
            orderId: id,
            rawMaterialId: m.rawMaterialId,
            unitQty: String(m.unitQty),
            unitName: String(m.unitName),
            notes: m.notes || null,
            timing: m.timing?.trim() || null,
            vendorId: m.vendorId || null,
            sortOrder: index,
          }))
        );
      }

      await syncOrderMenuDishes(id, dishIds, transaction);
      const saved = await transaction.query.orders.findFirst({ where: eq(orders.id, id), with: orderDetailWith });
      if (!saved) throw new Error("Order not found");
      const before = serializeOrder(previous);
      const next = serializeOrder(saved);
      const customer = await queueCustomerNotifications(transaction, before, next);
      const vendor = await queueVendorNotifications(transaction, before, next);
      return { count: customer.length + vendor.ids.length, manual: vendor.warnings.length };
    });

    revalidatePath("/orders");

    if (notifications.count > 0) after(async () => { await dispatchOrderMessages(id); });
    return { success: true as const, whatsappQueued: notifications.count > 0, whatsappWarning: notifications.manual ? "Vendor assignments were removed or moved. Contact those vendors manually; see WhatsApp history for details." : undefined };
  } catch (e: unknown) {
    const error = e as { code?: string; message?: string } | null;
    console.error("Error updating order:", e);
    if (error?.message === "Order not found") {
      return { error: "Order not found." };
    }
    if (error?.code === "23505" || error?.message?.includes("unique constraint") || error?.message?.includes("already exists")) {
      return { error: "An order with this ID already exists." };
    }
    return { error: error?.message || "Failed to update order due to an unexpected error." };
  }
}

export async function deleteOrder(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid order." };
  }

  const [deleted] = await db
    .delete(orders)
    .where(eq(orders.id, id))
    .returning({ id: orders.id });

  if (!deleted) {
    return { error: "Order not found." };
  }

  revalidatePath("/orders");
  return { success: true as const };
}

export async function addExtraPlates(formData: FormData) {
  const id = Number(formData.get("id"));
  const additionalPlates = Number(formData.get("additionalPlates"));
  if (!Number.isSafeInteger(id) || id <= 0) return { error: "Invalid order." };
  if (!Number.isSafeInteger(additionalPlates) || additionalPlates < 1 || additionalPlates > 100000) return { error: "Enter between 1 and 100,000 extra plates." };
  try {
    await ensureWhatsappOutbox();
    const result = await db.transaction(async transaction => {
      await transaction.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).for("update");
      const order = await transaction.query.orders.findFirst({ where: eq(orders.id, id), with: orderDetailWith });
      if (!order) return { error: "Order not found." };
      if (!order.perPlateAmount) return { error: "Set the per-plate amount before adding extra plates." };
      const newExtraPlates = order.extraPlates + additionalPlates;
      const totalPlates = order.numberOfPersons + newExtraPlates;
      const totalAmount = calculateTotalWithExtraPlates(order.numberOfPersons, newExtraPlates, order.perPlateAmount);
      if (totalAmount === null) return { error: "The updated plate count or total amount is too large." };
      await transaction.update(orders).set({ extraPlates: newExtraPlates, totalAmount, isPaymentAmount: true, updatedAt: new Date() }).where(eq(orders.id, id));
      const before = serializeOrder(order);
      const next = { ...before, extraPlates: newExtraPlates, totalAmount };
      await queueCustomerNotifications(transaction, before, next);
      await queueVendorNotifications(transaction, before, next);
      return { success: true as const, extraPlates: newExtraPlates, totalPlates, totalAmount };
    });
    if (result.error) return result;
    after(async () => { await dispatchOrderMessages(id); });
    revalidatePath("/orders");
    revalidatePath(`/orders/${id}/edit`);
    revalidatePath(`/orders/${id}/finance`);
    revalidatePath("/reports");
    return result;
  } catch { return { error: "Could not add extra plates. Please try again." }; }
}
