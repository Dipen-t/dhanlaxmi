"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orders } from "@/db/schema";

export type MealType = "breakfast" | "lunch" | "dinner";

export type OrderRecord = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
  numberOfPersons: number;
  mealType: MealType;
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
}): OrderRecord {
  return {
    id: order.id,
    orderId: order.orderId,
    date: toDateString(order.date),
    venue: order.venue,
    numberOfPersons: order.numberOfPersons,
    mealType: order.mealType,
  };
}

export async function getOrders(): Promise<OrderRecord[]> {
  const rows = await db.query.orders.findMany({
    orderBy: desc(orders.date),
  });

  return rows.map(serializeOrder);
}

export async function getSuggestedOrderId(): Promise<string> {
  const count = await db.$count(orders);
  return `ORD-${String(count + 1).padStart(3, "0")}`;
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

export async function createOrder(formData: FormData) {
  const orderId = normalizeText(String(formData.get("orderId") ?? ""));
  const date = String(formData.get("date") ?? "");
  const venue = normalizeText(String(formData.get("venue") ?? ""));
  const numberOfPersons = Number(formData.get("numberOfPersons"));
  const mealType = String(formData.get("mealType") ?? "");

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

  try {
    await db.insert(orders).values({
      orderId,
      date: new Date(date),
      venue,
      numberOfPersons,
      mealType: mealType as MealType,
    });
    revalidatePath("/orders");
    return { success: true as const };
  } catch {
    return { error: "An order with this ID already exists." };
  }
}

export async function updateOrder(formData: FormData) {
  const id = Number(formData.get("id"));
  const orderId = normalizeText(String(formData.get("orderId") ?? ""));
  const date = String(formData.get("date") ?? "");
  const venue = normalizeText(String(formData.get("venue") ?? ""));
  const numberOfPersons = Number(formData.get("numberOfPersons"));
  const mealType = String(formData.get("mealType") ?? "");

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
      return { error: "Order not found." };
    }

    revalidatePath("/orders");
    return { success: true as const };
  } catch {
    return { error: "An order with this ID already exists." };
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
