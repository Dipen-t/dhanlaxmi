"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orders, orderRawMaterials, rawMaterials } from "@/db/schema";
import { sendWhatsAppMessage } from "@/lib/whatsapp";


export type MealType = "breakfast" | "lunch" | "dinner";

export type OrderRawMaterialRecord = {
  rawMaterialId: number;
  unitQty: string;
  unitName: string;
};

export type OrderRecord = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
  numberOfPersons: number;
  mealType: MealType;
  rawMaterials: OrderRawMaterialRecord[];
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
  orderRawMaterials?: { rawMaterialId: number; unitQty: string; unitName: string }[];
}): OrderRecord {
  return {
    id: order.id,
    orderId: order.orderId,
    date: toDateString(order.date),
    venue: order.venue,
    numberOfPersons: order.numberOfPersons,
    mealType: order.mealType,
    rawMaterials: order.orderRawMaterials ?? [],
  };
}

export async function getOrders(): Promise<OrderRecord[]> {
  const rows = await db.query.orders.findMany({
    orderBy: desc(orders.date),
    with: {
      orderRawMaterials: true,
    },
  });

  return rows.map(serializeOrder);
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
  rawMaterials: OrderRawMaterialRecord[];
};

export async function createOrder(data: OrderInput) {
  const orderId = normalizeText(data.orderId || "");
  const date = data.date || "";
  const venue = normalizeText(data.venue || "");
  const numberOfPersons = Number(data.numberOfPersons);
  const mealType = data.mealType || "";
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
    }).returning({ id: orders.id });

    if (materials.length > 0) {
      await db.insert(orderRawMaterials).values(
        materials.map((m) => ({
          orderId: newOrder.id,
          rawMaterialId: m.rawMaterialId,
          unitQty: String(m.unitQty),
          unitName: String(m.unitName),
        }))
      );
    }

    if (materials.length > 0) {

      // WhatsApp Notification Logic
      const materialIds = materials.map((m) => m.rawMaterialId);
      const dbMaterials = await db.query.rawMaterials.findMany({
        where: inArray(rawMaterials.id, materialIds),
        with: { vendor: true },
      });

      const vendorGroups = new Map<number, { vendor: any; items: any[] }>();

      for (const m of materials) {
        const dbMaterial = dbMaterials.find((dbm) => dbm.id === m.rawMaterialId);
        if (dbMaterial && dbMaterial.vendor) {
          const v = dbMaterial.vendor;
          if (!vendorGroups.has(v.id)) {
            vendorGroups.set(v.id, { vendor: v, items: [] });
          }
          vendorGroups.get(v.id)!.items.push({
            name: dbMaterial.name,
            qty: m.unitQty,
            unit: m.unitName,
          });
        }
      }

      const messagePromises = [];
      for (const group of vendorGroups.values()) {
        const displayVenue = group.vendor.deliveryLocation === "godown" ? "Godown" : venue;
        let message = `New Order Alert!\nOrder ID: ${orderId}\nDate: ${date}\nVenue: ${displayVenue}\n\nPlease provide the following raw materials:\n`;
        for (const item of group.items) {
          message += `- ${item.name}: ${item.qty} ${item.unit}\n`;
        }
        
        messagePromises.push(sendWhatsAppMessage(group.vendor.phone, message).catch(console.error));
      }
      
      // Await all messages concurrently to ensure they finish before the server action returns
      await Promise.all(messagePromises);
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
