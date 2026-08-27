"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orderPayments, orderPaymentExpenses, vendors, vendorPayments } from "@/db/schema";

export type VendorDropdownItem = {
  id: number;
  name: string;
};

export async function getAllVendors(): Promise<VendorDropdownItem[]> {
  const allVendors = await db.query.vendors.findMany({
    orderBy: (vendors, { asc }) => [asc(vendors.name)],
    columns: { id: true, name: true }
  });
  return allVendors;
}

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

export async function createVendorPaymentForExpenses(data: FormData) {
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
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create vendor payment" };
  }
}
