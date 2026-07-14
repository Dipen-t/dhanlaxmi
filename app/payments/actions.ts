"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orders, orderPayments } from "@/db/schema";
import type { MealType } from "@/app/orders/actions";
import { calculateEffectiveTotal } from "@/lib/utils";

export type PaymentRecord = {
  id: number;
  orderId: number;
  amount: number;
  date: string;
  isWaived: boolean;
  notes: string | null;
  createdAt: string;
};

export type OrderWithBalance = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
  numberOfPersons: number;
  mealType: MealType;
  totalAmount: number | null;
  effectiveTotal: number | null;
  discount: string | null;
  payments: PaymentRecord[];
  totalPaid: number;
  balance: number | null;
  status: "Pending" | "Partial" | "Cleared" | "Waived";
};

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getOrdersWithBalances(): Promise<OrderWithBalance[]> {
  const allOrders = await db.query.orders.findMany({
    orderBy: desc(orders.date),
    with: {
      orderPayments: {
        orderBy: desc(orderPayments.date),
      },
    },
  });

  return allOrders.map((order) => {
    let totalPaid = 0;
    let totalWaived = 0;

    const payments: PaymentRecord[] = order.orderPayments.map((p) => {
      if (p.isWaived) {
        totalWaived += p.amount;
      } else {
        totalPaid += p.amount;
      }
      return {
        id: p.id,
        orderId: p.orderId,
        amount: p.amount,
        date: toDateString(p.date),
        isWaived: p.isWaived,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      };
    });

    let balance: number | null = null;
    const effectiveTotal = calculateEffectiveTotal(order.totalAmount, order.discount);

    if (effectiveTotal !== null) {
      balance = Math.max(0, effectiveTotal - totalPaid - totalWaived);
    }

    let status: "Pending" | "Partial" | "Cleared" | "Waived" = "Pending";
    if (effectiveTotal !== null) {
      if (balance === 0) {
        if (totalWaived > 0 && totalPaid === 0) {
          status = "Waived";
        } else {
          status = "Cleared";
        }
      } else if (totalPaid > 0 || totalWaived > 0) {
        status = "Partial";
      } else {
        status = "Pending";
      }
    } else if (totalPaid > 0 || totalWaived > 0) {
      status = "Partial";
    }

    return {
      id: order.id,
      orderId: order.orderId,
      date: toDateString(order.date),
      venue: order.venue,
      numberOfPersons: order.numberOfPersons,
      mealType: order.mealType,
      totalAmount: order.totalAmount,
      effectiveTotal,
      discount: order.discount,
      payments,
      totalPaid,
      balance,
      status,
    };
  });
}

export async function addPayment(data: { orderId: number; amount: number; date: string; notes?: string }) {
  if (!data.orderId || !data.amount || !data.date) {
    return { error: "Missing required fields." };
  }

  try {
    await db.insert(orderPayments).values({
      orderId: data.orderId,
      amount: data.amount,
      date: new Date(data.date),
      isWaived: false,
      notes: data.notes?.trim() || null,
    });

    revalidatePath("/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding payment:", error);
    return { error: error.message || "Failed to add payment." };
  }
}

export async function waiveBalance(data: { orderId: number; amount: number; date: string; notes?: string }) {
  if (!data.orderId || !data.amount || !data.date) {
    return { error: "Missing required fields." };
  }

  try {
    await db.insert(orderPayments).values({
      orderId: data.orderId,
      amount: data.amount,
      date: new Date(data.date),
      isWaived: true,
      notes: data.notes?.trim() || "Balance Waived",
    });

    revalidatePath("/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error waiving balance:", error);
    return { error: error.message || "Failed to waive balance." };
  }
}
