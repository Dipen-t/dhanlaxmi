"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orders, orderRawMaterials, rawMaterials, vendors } from "@/db/schema";
import { sendWhatsAppMessage } from "@/lib/whatsapp";


export type MealType = "breakfast" | "lunch" | "dinner";

export type OrderRawMaterialRecord = {
  rawMaterialId: number;
  unitQty: string;
  unitName: string;
  notes?: string | null;
  vendorId?: number | null;
};

export type OrderRecord = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
  numberOfPersons: number;
  mealType: MealType;
  totalAmount: number | null;
  payment: string | null;
  discount: string | null;
  isPaymentAmount: boolean;
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
  payment: string | null;
  discount: string | null;
  isPaymentAmount: boolean;
  orderRawMaterials?: { rawMaterialId: number; unitQty: string; unitName: string; notes?: string | null; vendorId: number | null; vendor?: { name: string } | null }[];
}): OrderRecord {
  const vendors = Array.from(new Set((order.orderRawMaterials || [])
    .map(rm => rm.vendor?.name)
    .filter((name): name is string => !!name)));

  return {
    id: order.id,
    orderId: order.orderId,
    date: toDateString(order.date),
    venue: order.venue,
    numberOfPersons: order.numberOfPersons,
    mealType: order.mealType,
    totalAmount: order.totalAmount,
    payment: order.payment,
    discount: order.discount,
    isPaymentAmount: order.isPaymentAmount,
    rawMaterials: order.orderRawMaterials?.map(rm => ({
      ...rm,
      vendorId: rm.vendorId
    })) ?? [],
    vendors,
  };
}

export async function getOrders(): Promise<OrderRecord[]> {
  const rows = await db.query.orders.findMany({
    orderBy: desc(orders.date),
    with: {
      orderRawMaterials: {
        with: {
          vendor: true,
        },
      },
    },
  });

  return rows.map(serializeOrder);
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return null;
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, numericId),
    with: {
      orderRawMaterials: {
        with: {
          vendor: true,
        },
      },
    },
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
  payment?: string;
  discount?: string;
  rawMaterials: OrderRawMaterialRecord[];
};

export async function createOrder(data: OrderInput) {
  const orderId = normalizeText(data.orderId || "");
  const date = data.date || "";
  const venue = normalizeText(data.venue || "");
  const numberOfPersons = Number(data.numberOfPersons);
  const mealType = data.mealType || "";
  const totalAmount = data.totalAmount ? Number(data.totalAmount) : null;
  const payment = data.payment?.trim() || null;
  const discount = data.discount?.trim() || null;
  const isPaymentAmount = payment !== null && payment !== "";
  const materials = data.rawMaterials || [];

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
    const [newOrder] = await db.insert(orders).values({
      orderId,
      date: new Date(date),
      venue,
      numberOfPersons,
      mealType: mealType as MealType,
      totalAmount,
      payment,
      discount,
      isPaymentAmount,
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

    if (materials.length > 0) {

      // WhatsApp Notification Logic
      const materialIds = materials.map((m) => m.rawMaterialId);
      const dbMaterials = await db.query.rawMaterials.findMany({
        where: inArray(rawMaterials.id, materialIds),
      });

      const selectedVendorIds = materials
        .map((m) => m.vendorId)
        .filter((id): id is number => id != null);
      
      const uniqueVendorIds = [...new Set(selectedVendorIds)];
      let dbVendors: any[] = [];
      if (uniqueVendorIds.length > 0) {
        dbVendors = await db.query.vendors.findMany({
          where: inArray(vendors.id, uniqueVendorIds),
        });
      }

      const vendorGroups = new Map<number, { vendor: any; items: any[] }>();

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
        // Format date as dd/mm/yyyy for the WhatsApp message
        const [yyyy, mm, dd] = date.split("-");
        const formattedDate = `${dd}/${mm}/${yyyy}`;
        let message = `New Order Alert!\nOrder ID: ${orderId}\nDate: ${formattedDate}\nVenue: ${displayVenue}\n\nPlease provide the following raw materials:\n`;
        for (const item of group.items) {
          if (item.notes) {
            message += `- ${item.name} - ${item.notes}: ${item.qty} ${item.unit}\n`;
          } else {
            message += `- ${item.name}: ${item.qty} ${item.unit}\n`;
          }
        }
        
        // Send messages sequentially to avoid rate-limiting from the WhatsApp API provider
        await sendWhatsAppMessage(group.vendor.phone, message);
      }
    }

    revalidatePath("/orders");
    return { success: true as const };
  } catch (e: any) {
    console.error("Error creating order:", e);
    if (e?.code === "23505" || e?.message?.includes("unique constraint") || e?.message?.includes("already exists")) {
      return { error: "An order with this ID already exists." };
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
  const totalAmount = data.totalAmount ? Number(data.totalAmount) : null;
  const payment = data.payment?.trim() || null;
  const discount = data.discount?.trim() || null;
  const isPaymentAmount = payment !== null && payment !== "";
  const materials = data.rawMaterials || [];

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
    const [updated] = await db
      .update(orders)
      .set({
        orderId,
        date: new Date(date),
        venue,
        numberOfPersons,
        mealType: mealType as MealType,
        totalAmount,
        payment,
        discount,
        isPaymentAmount,
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
