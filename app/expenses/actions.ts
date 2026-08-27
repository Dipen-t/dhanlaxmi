"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orderPayments, orderPaymentExpenses } from "@/db/schema";

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

export async function getOrderPaymentsWithExpenses(orderId: number): Promise<OrderPaymentRecord[]> {
  const payments = await db.query.orderPayments.findMany({
    where: and(eq(orderPayments.orderId, orderId), eq(orderPayments.isWaived, false)),
    with: {
      expenses: true,
    },
    orderBy: (orderPayments, { desc }) => [desc(orderPayments.date)],
  });

  return payments.map((p) => ({
    ...p,
    date: p.date.toISOString().slice(0, 10),
    expenses: p.expenses.map((e) => ({
      ...e,
      date: e.date.toISOString().slice(0, 10),
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  }));
}

export async function createExpense(data: FormData) {
  const orderPaymentId = Number(data.get("orderPaymentId"));
  const amount = Number(data.get("amount"));
  const description = data.get("description") as string;
  const dateStr = data.get("date") as string;

  if (!orderPaymentId || !amount || !description) {
    return { error: "Missing required fields" };
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  try {
    await db.insert(orderPaymentExpenses).values({
      orderPaymentId,
      amount,
      description,
      date,
    });
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create expense" };
  }
}

export async function deleteExpense(data: FormData) {
  const id = Number(data.get("id"));

  if (!id) {
    return { error: "Missing required fields" };
  }

  try {
    await db.delete(orderPaymentExpenses).where(eq(orderPaymentExpenses.id, id));
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to delete expense" };
  }
}
