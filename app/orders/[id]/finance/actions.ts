"use server";

import { eq } from "drizzle-orm";
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
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create expense" };
  }
}
