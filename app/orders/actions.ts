"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  dishes,
  orderMenuDishes,
  orders,
  orderRawMaterials,
  rawMaterials,
  vendors,
} from "@/db/schema";
import { sendWhatsAppMessage } from "@/lib/whatsapp";


export type MealType = "breakfast" | "lunch" | "dinner";

export type OrderRawMaterialRecord = {
  rawMaterialId: number;
  unitQty: string;
  unitName: string;
  notes?: string | null;
  vendorId?: number | null;
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
  venue: string;
  numberOfPersons: number;
  mealType: MealType;
  totalAmount: number | null;
  discount: string | null;
  customerName: string | null;
  customerPhone: string | null;
  isPaymentAmount: boolean;
  menuId: number | null;
  menuName: string | null;
  menuDishes: OrderMenuDishRecord[];
  rawMaterials: OrderRawMaterialRecord[];
  vendors: string[];
};

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function serializeOrder(order: {
  id: number;
  orderId: string;
  date: Date;
  venue: string;
  numberOfPersons: number;
  mealType: MealType;
  totalAmount: number | null;
  discount: string | null;
  customerName: string | null;
  customerPhone: string | null;
  isPaymentAmount: boolean;
  menuId?: number | null;
  menu?: { id: number; name: string } | null;
  orderMenuDishes?: {
    dishId: number;
    sortOrder: number;
    dish?: { id: number; name: string; categoryId: number; category?: { id: number; name: string } | null } | null;
  }[];
  orderRawMaterials?: { rawMaterialId: number; unitQty: string; unitName: string; notes?: string | null; vendorId: number | null; vendor?: { name: string } | null }[];
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
    venue: order.venue,
    numberOfPersons: order.numberOfPersons,
    mealType: order.mealType,
    totalAmount: order.totalAmount,
    discount: order.discount,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    isPaymentAmount: order.isPaymentAmount,
    menuId: order.menuId ?? order.menu?.id ?? null,
    menuName: order.menu?.name ?? null,
    menuDishes,
    rawMaterials: order.orderRawMaterials?.map(rm => ({
      ...rm,
      vendorId: rm.vendorId
    })) ?? [],
    vendors,
  };
}

const orderDetailWith = {
  menu: true as const,
  orderMenuDishes: {
    with: {
      dish: {
        with: {
          category: true as const,
        },
      },
    },
  },
  orderRawMaterials: {
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

  return rows.map(serializeOrder).sort(compareOrdersAscending);
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
    return "Number of persons must be at least 1.";
  }
  if (numberOfPersons > 100000) {
    return "Number of persons is too large.";
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
  mealType: string;
  totalAmount?: string;
  discount?: string;
  customerName?: string;
  customerPhone?: string;
  menuId?: number | null;
  menuDishIds?: number[];
  rawMaterials: OrderRawMaterialRecord[];
};

async function syncOrderMenuDishes(orderId: number, dishIds: number[]) {
  await db.delete(orderMenuDishes).where(eq(orderMenuDishes.orderId, orderId));
  const uniqueIds = [...new Set(dishIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (uniqueIds.length === 0) return;

  const valid = await db.query.dishes.findMany({
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
    await db.insert(orderMenuDishes).values(rows);
  }
}

async function notifyVendorsForOrder(params: {
  orderId: string;
  date: string;
  venue: string;
  materials: OrderRawMaterialRecord[];
}) {
  const { orderId, date, venue, materials } = params;
  if (materials.length === 0) return;

  try {
    const materialIds = materials.map((m) => m.rawMaterialId);
    const dbMaterials = await db.query.rawMaterials.findMany({
      where: inArray(rawMaterials.id, materialIds),
    });

    const selectedVendorIds = materials
      .map((m) => m.vendorId)
      .filter((id): id is number => id != null);

    const uniqueVendorIds = [...new Set(selectedVendorIds)];
    let dbVendors: { id: number; name: string; phone: string; deliveryLocation: string }[] = [];
    if (uniqueVendorIds.length > 0) {
      dbVendors = await db.query.vendors.findMany({
        where: inArray(vendors.id, uniqueVendorIds),
      });
    }

    const vendorGroups = new Map<
      number,
      { vendor: (typeof dbVendors)[number]; items: { name: string; qty: string; unit: string; notes?: string | null }[] }
    >();

    for (const m of materials) {
      if (!m.vendorId) continue;

      const dbMaterial = dbMaterials.find((dbm) => dbm.id === m.rawMaterialId);
      const dbVendor = dbVendors.find((v) => v.id === m.vendorId);

      if (dbMaterial && dbVendor) {
        if (!vendorGroups.has(dbVendor.id)) {
          vendorGroups.set(dbVendor.id, { vendor: dbVendor, items: [] });
        }
        vendorGroups.get(dbVendor.id)!.items.push({
          name: dbMaterial.name,
          qty: m.unitQty,
          unit: m.unitName,
          notes: m.notes,
        });
      }
    }

    for (const group of vendorGroups.values()) {
      const displayVenue = group.vendor.deliveryLocation === "godown" ? "Godown" : venue;
      const [yyyy, mm, dd] = date.split("-");
      const formattedDate = `${dd}/${mm}/${yyyy}`;

      let message = `New Order Alert!\nOrder ID: ${orderId}\nDate: ${formattedDate}\nVenue: ${displayVenue}\n`;

      const itemsWithNotes = group.items.filter((i) => i.notes && i.notes.trim().length > 0);
      if (itemsWithNotes.length > 0) {
        message += `Hi tea details: ${itemsWithNotes.map((i) => `${i.name} (${i.notes})`).join(", ")}\n`;
      }

      message += `\nPlease provide the following raw materials:\n`;

      for (const item of group.items) {
        message += `- ${item.name}: ${item.qty} ${item.unit}\n`;
      }

      await sendWhatsAppMessage(group.vendor.phone, message);
    }
  } catch (error) {
    console.error("Vendor WhatsApp notify failed (order already saved):", error);
  }
}

export async function createOrder(data: OrderInput) {
  const preferredOrderId = normalizeText(data.orderId || "");
  const date = data.date || "";
  const venue = normalizeText(data.venue || "");
  const numberOfPersons = Number(data.numberOfPersons);
  const mealType = data.mealType || "";
  const totalAmount = data.totalAmount ? Number(String(data.totalAmount).replace(/,/g, "")) : null;
  const discount = data.discount?.replace(/,/g, "").trim() || null;
  const customerName = data.customerName?.trim() || null;
  const customerPhone = data.customerPhone?.trim() || null;
  const isPaymentAmount = totalAmount !== null && totalAmount > 0;
  const materials = data.rawMaterials || [];
  const menuId = data.menuId && Number.isFinite(data.menuId) ? Number(data.menuId) : null;
  const menuDishIds = data.menuDishIds || [];

  const orderId = await allocateUniqueOrderId(preferredOrderId);

  const error = validateOrderFields(
    orderId,
    date,
    venue,
    numberOfPersons,
    mealType,
  );
  if (error) {
    return { error };
  }

  const uniqueMaterialIds = new Set(materials.map((m) => m.rawMaterialId));
  if (uniqueMaterialIds.size !== materials.length) {
    return { error: "Duplicate raw materials selected. Please remove the duplicates." };
  }

  for (const m of materials) {
    if (!String(m.unitQty || "").trim() || String(m.unitQty) === "0") {
      return { error: "Each selected material needs a quantity." };
    }
    if (!String(m.unitName || "").trim()) {
      return { error: "Each selected material needs a unit." };
    }
  }

  try {
    // Parse as local calendar date to avoid UTC day-shift.
    const [y, mo, d] = date.split("-").map(Number);
    const eventDate = new Date(y, (mo || 1) - 1, d || 1);

    const [newOrder] = await db.insert(orders).values({
      orderId,
      date: eventDate,
      venue,
      numberOfPersons,
      mealType: mealType as MealType,
      totalAmount,
      discount,
      customerName,
      customerPhone,
      isPaymentAmount,
      menuId,
      extraPlates: 0,
    }).returning({ id: orders.id });

    if (materials.length > 0) {
      await db.insert(orderRawMaterials).values(
        materials.map((m) => ({
          orderId: newOrder.id,
          rawMaterialId: m.rawMaterialId,
          unitQty: String(m.unitQty),
          unitName: String(m.unitName),
          notes: m.notes || null,
          vendorId: m.vendorId || null,
        }))
      );
    }

    await syncOrderMenuDishes(newOrder.id, menuDishIds);

    revalidatePath("/orders");

    // Never block order creation on WhatsApp (shared hosting timeouts).
    void notifyVendorsForOrder({ orderId, date, venue, materials });

    return { success: true as const, id: newOrder.id, orderId };
  } catch (e: any) {
    console.error("Error creating order:", e);
    if (e?.code === "23505" || e?.message?.includes("unique constraint") || e?.message?.includes("already exists")) {
      return { error: "An order with this ID already exists. Refresh and try again." };
    }
    return { error: e?.message || "Failed to create order due to an unexpected error." };
  }
}

export async function updateOrder(data: OrderInput) {
  const id = Number(data.id);
  const orderId = normalizeText(data.orderId || "");
  const date = data.date || "";
  const venue = normalizeText(data.venue || "");
  const numberOfPersons = Number(data.numberOfPersons);
  const mealType = data.mealType || "";
  const totalAmount = data.totalAmount ? Number(String(data.totalAmount).replace(/,/g, "")) : null;
  const discount = data.discount?.replace(/,/g, "").trim() || null;
  const customerName = data.customerName?.trim() || null;
  const customerPhone = data.customerPhone?.trim() || null;
  const isPaymentAmount = totalAmount !== null && totalAmount > 0;
  const materials = data.rawMaterials || [];
  const menuId = data.menuId && Number.isFinite(data.menuId) ? Number(data.menuId) : null;
  const menuDishIds = data.menuDishIds || [];

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid order." };
  }

  const error = validateOrderFields(
    orderId,
    date,
    venue,
    numberOfPersons,
    mealType,
  );
  if (error) {
    return { error };
  }

  const uniqueMaterialIds = new Set(materials.map((m) => m.rawMaterialId));
  if (uniqueMaterialIds.size !== materials.length) {
    return { error: "Duplicate raw materials selected. Please remove the duplicates." };
  }

  try {
    const [y, mo, d] = date.split("-").map(Number);
    const eventDate = new Date(y, (mo || 1) - 1, d || 1);

    const [updated] = await db
      .update(orders)
      .set({
        orderId,
        date: eventDate,
        venue,
        numberOfPersons,
        mealType: mealType as MealType,
        totalAmount,
        discount,
        customerName,
        customerPhone,
        isPaymentAmount,
        menuId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning({ id: orders.id });

    if (!updated) {
      throw new Error("Order not found");
    }

    await db.delete(orderRawMaterials).where(eq(orderRawMaterials.orderId, id));
    if (materials.length > 0) {
      await db.insert(orderRawMaterials).values(
        materials.map((m) => ({
          orderId: id,
          rawMaterialId: m.rawMaterialId,
          unitQty: String(m.unitQty),
          unitName: String(m.unitName),
          notes: m.notes || null,
          vendorId: m.vendorId || null,
        }))
      );
    }

    await syncOrderMenuDishes(id, menuDishIds);

    revalidatePath("/orders");
    return { success: true as const };
  } catch (e: any) {
    console.error("Error updating order:", e);
    if (e?.message === "Order not found") {
      return { error: "Order not found." };
    }
    if (e?.code === "23505" || e?.message?.includes("unique constraint") || e?.message?.includes("already exists")) {
      return { error: "An order with this ID already exists." };
    }
    return { error: e?.message || "Failed to update order due to an unexpected error." };
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
