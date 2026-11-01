"use server";

import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { vendorPayments, orderMenuDishes } from "@/db/schema";

export type VendorPaymentOrderSummary = {
  id: number;
  orderNumber: string;
  date: string;
  venue: string;
  customerName: string | null;
  mealType: string;
  menuName: string | null;
  dishNames: string[];
};

export type VendorPaymentRecord = {
  id: number;
  vendorId: number;
  orderId: number | null;
  amount: number;
  date: string;
  notes: string | null;
  order: VendorPaymentOrderSummary | null;
};

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export type OrderDropdownItem = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
  customerName: string | null;
};

export async function getOrdersForDropdown(): Promise<OrderDropdownItem[]> {
  const allOrders = await db.query.orders.findMany({
    orderBy: (orders, { desc }) => [desc(orders.date)],
    columns: {
      id: true,
      orderId: true,
      date: true,
      venue: true,
      customerName: true,
    },
  });
  return allOrders.map((o) => ({
    ...o,
    date: toDateString(o.date),
  }));
}

export async function getVendorFinances(vendorId: string): Promise<VendorPaymentRecord[]> {
  const numericId = Number(vendorId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return [];
  }

  const payments = await db.query.vendorPayments.findMany({
    where: eq(vendorPayments.vendorId, numericId),
    orderBy: (vendorPayments, { desc }) => [desc(vendorPayments.date)],
    with: {
      order: {
        with: {
          menu: true,
          orderMenuDishes: {
            orderBy: [asc(orderMenuDishes.sortOrder)],
            with: {
              dish: true,
            },
          },
        },
      },
    },
  });

  return payments.map((p) => {
    const linked = p.order;
    return {
      id: p.id,
      vendorId: p.vendorId,
      orderId: p.orderId,
      amount: p.amount,
      date: toDateString(p.date),
      notes: p.notes,
      order: linked
        ? {
            id: linked.id,
            orderNumber: linked.orderId,
            date: toDateString(linked.date),
            venue: linked.venue,
            customerName: linked.customerName,
            mealType: linked.mealType,
            menuName: linked.menu?.name ?? null,
            dishNames: (linked.orderMenuDishes ?? [])
              .map((entry) => entry.dish?.name)
              .filter((name): name is string => Boolean(name)),
          }
        : null,
    };
  });
}

export async function createVendorPayment(data: FormData) {
  const vendorId = Number(data.get("vendorId"));
  const orderIdStr = data.get("orderId") as string;
  const orderId = orderIdStr ? Number(orderIdStr) : null;
  const amount = Number(data.get("amount"));
  const date = data.get("date") as string;
  const notes = data.get("notes") as string || null;

  if (!vendorId || !amount || !date) {
    return { error: "Missing required fields" };
  }

  try {
    await db.insert(vendorPayments).values({
      vendorId,
      orderId,
      amount,
      date: new Date(date),
      notes,
    });
    revalidatePath(`/vendors/${vendorId}/finance`);
    revalidatePath("/reports");
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create payment out" };
  }
}

export async function updateVendorPayment(data: FormData) {
  const id = Number(data.get("id"));
  const vendorId = Number(data.get("vendorId"));
  const orderIdStr = data.get("orderId") as string;
  const orderId = orderIdStr ? Number(orderIdStr) : null;
  const amount = Number(data.get("amount"));
  const date = data.get("date") as string;
  const notes = data.get("notes") as string || null;

  if (!id || !vendorId || !amount || !date) {
    return { error: "Missing required fields" };
  }

  try {
    await db.update(vendorPayments).set({
      orderId,
      amount,
      date: new Date(date),
      notes,
    }).where(and(eq(vendorPayments.id, id), eq(vendorPayments.vendorId, vendorId)));
    
    revalidatePath(`/vendors/${vendorId}/finance`);
    revalidatePath("/reports");
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to update payment out" };
  }
}

export async function deleteVendorPayment(data: FormData) {
  const id = Number(data.get("id"));
  const vendorId = Number(data.get("vendorId"));

  if (!id || !vendorId) {
    return { error: "Missing required fields" };
  }

  try {
    await db.delete(vendorPayments).where(and(eq(vendorPayments.id, id), eq(vendorPayments.vendorId, vendorId)));
    revalidatePath(`/vendors/${vendorId}/finance`);
    revalidatePath("/reports");
    revalidatePath("/expenses");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to delete payment out" };
  }
}
