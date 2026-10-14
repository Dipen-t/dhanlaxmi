"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orderPayments, orderPaymentExpenses, orders } from "@/db/schema";

export type OrderPaymentExpenseRecord = {
  id: number;
  orderPaymentId: number;
  amount: number;
  description: string;
  date: string;
};

export type OrderPaymentRecord = {
  id: number;
  orderId: number;
  amount: number;
  date: string;
  isWaived: boolean;
  notes: string | null;
  expenses: OrderPaymentExpenseRecord[];
};

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getOrderFinances(orderId: string): Promise<OrderPaymentRecord[]> {
  const numericId = Number(orderId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return [];
  }

  const payments = await db.query.orderPayments.findMany({
    where: eq(orderPayments.orderId, numericId),
    with: {
      expenses: true,
    },
    orderBy: (orderPayments, { desc }) => [desc(orderPayments.date)],
  });

  return payments.map(p => ({
    ...p,
    date: toDateString(p.date),
    expenses: p.expenses.map(e => ({
      ...e,
      date: toDateString(e.date),
    }))
  }));
}

export async function createOrderPayment(data: FormData) {
  const orderId = Number(data.get("orderId"));
  const amount = Number(data.get("amount"));
  const date = data.get("date") as string;
  const isWaived = data.get("isWaived") === "true";
  const notes = data.get("notes") as string || null;

  if (!orderId || !amount || !date) {
    return { error: "Missing required fields" };
  }

  try {
    await db.insert(orderPayments).values({
      orderId,
      amount,
      date: new Date(date),
      isWaived,
      notes,
    });
    revalidatePath(`/orders/${orderId}/finance`);
    revalidatePath("/reports");
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create payment" };
  }
}

export async function createOrderPaymentExpense(data: FormData) {
  const orderId = Number(data.get("orderId"));
  const orderPaymentId = Number(data.get("orderPaymentId"));
  const amount = Number(data.get("amount"));
  const date = data.get("date") as string;
  const description = data.get("description") as string;

  if (!orderPaymentId || !amount || !date || !description) {
    return { error: "Missing required fields" };
  }

  try {
    await db.insert(orderPaymentExpenses).values({
      orderPaymentId,
      amount,
      date: new Date(date),
      description,
    });
    revalidatePath(`/orders/${orderId}/finance`);
    revalidatePath("/reports");
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create expense" };
  }
}

export async function updateOrderPayment(data: FormData) {
  const id = Number(data.get("id"));
  const orderId = Number(data.get("orderId"));
  const amount = Number(data.get("amount"));
  const date = data.get("date") as string;
  const notes = data.get("notes") as string || null;

  if (!id || !orderId || !amount || !date) {
    return { error: "Missing required fields" };
  }

  try {
    await db.update(orderPayments).set({
      amount,
      date: new Date(date),
      notes,
    }).where(and(eq(orderPayments.id, id), eq(orderPayments.orderId, orderId)));
    
    revalidatePath(`/orders/${orderId}/finance`);
    revalidatePath("/reports");
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to update payment" };
  }
}

export async function deleteOrderPayment(data: FormData) {
  const id = Number(data.get("id"));
  const orderId = Number(data.get("orderId"));

  if (!id || !orderId) {
    return { error: "Missing required fields" };
  }

  try {
    await db.delete(orderPayments).where(and(eq(orderPayments.id, id), eq(orderPayments.orderId, orderId)));
    revalidatePath(`/orders/${orderId}/finance`);
    revalidatePath("/reports");
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to delete payment" };
  }
}

import { vendorPayments } from "@/db/schema";

export async function createVendorPaymentForOrderFinance(data: FormData) {
  const vendorId = Number(data.get("vendorId"));
  const orderId = Number(data.get("orderId"));
  const amount = Number(data.get("amount"));
  const dateStr = data.get("date") as string;
  const notes = data.get("notes") as string || null;

  if (!vendorId || !orderId || !amount) {
    return { error: "Missing required fields" };
  }
  
  const date = dateStr ? new Date(dateStr) : new Date();

  try {
    await db.insert(vendorPayments).values({
      vendorId,
      orderId,
      amount,
      date,
      notes,
    });
    revalidatePath(`/orders/${orderId}/finance`);
    revalidatePath("/reports");
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create vendor payment" };
  }
}
