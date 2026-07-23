"use server";

import { desc, eq, inArray, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orders, vendorPayments, vendors, orderRawMaterials } from "@/db/schema";
import type { DeliveryLocation } from "@/app/vendors/actions";

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export type OrderSelectionItem = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
};

export async function getOrdersForSelection(): Promise<OrderSelectionItem[]> {
  const allOrders = await db.query.orders.findMany({
    orderBy: (orders, { desc }) => [desc(orders.date)],
    columns: {
      id: true,
      orderId: true,
      date: true,
      venue: true,
    }
  });
  return allOrders.map(o => ({
    ...o,
    date: toDateString(o.date),
  }));
}

export type VendorBasicInfo = {
  id: number;
  name: string;
  deliveryLocation: DeliveryLocation;
};

export async function getAllVendors(): Promise<VendorBasicInfo[]> {
  const allVendors = await db.query.vendors.findMany({
    orderBy: [asc(vendors.name)],
    columns: {
      id: true,
      name: true,
      deliveryLocation: true,
    },
  });
  return allVendors;
}

export async function getOrderVendors(orderId: number): Promise<VendorBasicInfo[]> {
  if (!orderId || Number.isNaN(orderId)) return [];

  const rawMaterials = await db.query.orderRawMaterials.findMany({
    where: eq(orderRawMaterials.orderId, orderId),
    columns: {
      vendorId: true,
    },
  });

  const vendorIds = Array.from(new Set(rawMaterials.map(rm => rm.vendorId).filter((id): id is number => id !== null)));
  
  if (vendorIds.length === 0) return [];

  const linkedVendors = await db.query.vendors.findMany({
    where: inArray(vendors.id, vendorIds),
    columns: {
      id: true,
      name: true,
      deliveryLocation: true,
    },
    orderBy: [asc(vendors.name)],
  });

  return linkedVendors;
}

export type OrderPaymentInfo = {
  id: number;
  vendorId: number;
  amount: number;
  date: string;
};

export async function getOrderPayments(orderId: number): Promise<OrderPaymentInfo[]> {
  if (!orderId || Number.isNaN(orderId)) return [];

  const payments = await db.query.vendorPayments.findMany({
    where: eq(vendorPayments.orderId, orderId),
    columns: {
      id: true,
      vendorId: true,
      amount: true,
      date: true,
    },
    orderBy: (vendorPayments, { desc }) => [desc(vendorPayments.createdAt)],
  });

  return payments.map(p => ({
    ...p,
    date: toDateString(p.date),
  }));
}

export async function recordPayment(data: FormData) {
  const vendorId = Number(data.get("vendorId"));
  const orderId = Number(data.get("orderId"));
  const amount = Number(data.get("amount"));

  if (!vendorId || !orderId || !amount) {
    return { error: "Missing required fields" };
  }

  try {
    await db.insert(vendorPayments).values({
      vendorId,
      orderId,
      amount,
      date: new Date(),
    });
    
    // We revalidate both vendors and payments to keep everything fresh
    revalidatePath("/payments");
    revalidatePath(`/vendors/${vendorId}/finance`);
    
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to record payment" };
  }
}
