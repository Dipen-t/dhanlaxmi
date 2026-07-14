"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { orders, vendorPayments } from "@/db/schema";

export type VendorPaymentRecord = {
  id: number;
  orderId: number;
  vendorId: number;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
};

export type OrderVendorRecord = {
  vendorId: number;
  vendorName: string;
  totalPaid: number;
  payments: VendorPaymentRecord[];
};

export type OrderWithVendorPayments = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
  vendors: OrderVendorRecord[];
  totalPaidOut: number;
};

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getOrdersWithVendorPayments(): Promise<OrderWithVendorPayments[]> {
  const allOrders = await db.query.orders.findMany({
    orderBy: desc(orders.date),
    with: {
      orderRawMaterials: {
        with: {
          vendor: true,
        },
      },
      vendorPayments: {
        orderBy: desc(vendorPayments.date),
      },
    },
  });

  return allOrders.map((order) => {
    // 1. Find unique vendors for this order
    const vendorMap = new Map<number, { vendorId: number; vendorName: string }>();
    for (const rm of order.orderRawMaterials || []) {
      if (rm.vendorId && rm.vendor) {
        if (!vendorMap.has(rm.vendorId)) {
          vendorMap.set(rm.vendorId, { vendorId: rm.vendorId, vendorName: rm.vendor.name });
        }
      }
    }

    // 2. Map payments to these vendors
    const vendorRecords: OrderVendorRecord[] = Array.from(vendorMap.values()).map(v => ({
      ...v,
      totalPaid: 0,
      payments: [],
    }));

    // Some payments might be for a vendor that was removed from raw materials? 
    // We should probably still show them. Let's ensure any vendor with a payment is included.
    for (const p of order.vendorPayments || []) {
      if (!vendorMap.has(p.vendorId)) {
        // Find vendor name if possible, else just "Unknown Vendor"
        // Since we only queried orderRawMaterials, we might not have the vendor name.
        // But for consistency, let's add it. We can fetch it if needed, or just say Vendor #ID
        vendorMap.set(p.vendorId, { vendorId: p.vendorId, vendorName: `Vendor #${p.vendorId}` });
        vendorRecords.push({
          vendorId: p.vendorId,
          vendorName: `Vendor #${p.vendorId} (Removed from Order)`,
          totalPaid: 0,
          payments: [],
        });
      }
      
      const vRecord = vendorRecords.find(vr => vr.vendorId === p.vendorId)!;
      vRecord.totalPaid += p.amount;
      vRecord.payments.push({
        id: p.id,
        orderId: p.orderId,
        vendorId: p.vendorId,
        amount: p.amount,
        date: toDateString(p.date),
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      });
    }

    const totalPaidOut = vendorRecords.reduce((sum, v) => sum + v.totalPaid, 0);

    return {
      id: order.id,
      orderId: order.orderId,
      date: toDateString(order.date),
      venue: order.venue,
      vendors: vendorRecords.sort((a, b) => a.vendorName.localeCompare(b.vendorName)),
      totalPaidOut,
    };
  });
}

export async function addVendorPayment(data: { orderId: number; vendorId: number; amount: number; date: string; notes?: string }) {
  if (!data.orderId || !data.vendorId || !data.amount || !data.date) {
    return { error: "Missing required fields." };
  }

  try {
    await db.insert(vendorPayments).values({
      orderId: data.orderId,
      vendorId: data.vendorId,
      amount: data.amount,
      date: new Date(data.date),
      notes: data.notes?.trim() || null,
    });

    revalidatePath("/payments-out");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding vendor payment:", error);
    return { error: error.message || "Failed to record payment." };
  }
}

export async function deleteVendorPayment(paymentId: number) {
  if (!paymentId) {
    return { error: "Missing payment ID." };
  }

  try {
    await db.delete(vendorPayments).where(eq(vendorPayments.id, paymentId));
    revalidatePath("/payments-out");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting vendor payment:", error);
    return { error: error.message || "Failed to delete payment." };
  }
}
