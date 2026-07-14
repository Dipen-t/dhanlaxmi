"use server";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderPayments, vendorPayments, vendors } from "@/db/schema";
import { calculateEffectiveTotal } from "@/lib/utils";
import type { MealType } from "@/app/orders/actions";

export type EventProfitability = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
  mealType: MealType;
  revenue: number;
  clientPaid: number;
  clientBalance: number;
  vendorExpenses: number;
  netProfit: number;
};

export type LedgerTransaction = {
  id: string; // Unique string for React key
  date: string;
  type: "IN" | "OUT";
  amount: number;
  reference: string;
  notes: string | null;
  createdAt: string;
};

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getEventProfitabilityReport(): Promise<EventProfitability[]> {
  const allOrders = await db.query.orders.findMany({
    orderBy: desc(orders.date),
    with: {
      orderPayments: true,
    },
  });

  const allVendorPayments = await db.query.vendorPayments.findMany();

  return allOrders.map(order => {
    const effectiveTotal = calculateEffectiveTotal(order.totalAmount, order.discount) || 0;
    
    let clientPaid = 0;
    let totalWaived = 0;
    for (const p of order.orderPayments) {
      if (p.isWaived) {
        totalWaived += p.amount;
      } else {
        clientPaid += p.amount;
      }
    }

    const clientBalance = Math.max(0, effectiveTotal - clientPaid - totalWaived);

    const relatedVendorPayments = allVendorPayments.filter(vp => vp.orderId === order.id);
    const vendorExpenses = relatedVendorPayments.reduce((sum, vp) => sum + vp.amount, 0);

    const netProfit = effectiveTotal - vendorExpenses;

    return {
      id: order.id,
      orderId: order.orderId,
      date: toDateString(order.date),
      venue: order.venue,
      mealType: order.mealType,
      revenue: effectiveTotal,
      clientPaid,
      clientBalance,
      vendorExpenses,
      netProfit,
    };
  });
}

export async function getMasterLedger(): Promise<LedgerTransaction[]> {
  const op = await db.query.orderPayments.findMany({
    with: {
      order: true,
    }
  });

  const vp = await db.query.vendorPayments.findMany({
    with: {
      order: true,
      vendor: true,
    }
  });

  const transactions: LedgerTransaction[] = [];

  for (const p of op) {
    if (p.isWaived) continue; // Don't show waived as actual money in
    transactions.push({
      id: `in-${p.id}`,
      date: toDateString(p.date),
      type: "IN",
      amount: p.amount,
      reference: `Order ${p.order?.orderId || `#${p.orderId}`}`,
      notes: p.notes || "Client Payment",
      createdAt: p.createdAt.toISOString(),
    });
  }

  for (const p of vp) {
    transactions.push({
      id: `out-${p.id}`,
      date: toDateString(p.date),
      type: "OUT",
      amount: p.amount,
      reference: `Vendor ${p.vendor?.name || `#${p.vendorId}`} (Order ${p.order?.orderId || `#${p.orderId}`})`,
      notes: p.notes || "Vendor Payment",
      createdAt: p.createdAt.toISOString(),
    });
  }

  // Sort descending by date, then by created at if dates match
  return transactions.sort((a, b) => {
    if (a.date !== b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
