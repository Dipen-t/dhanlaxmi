"use server";

import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderPayments, vendorPayments, vendors } from "@/db/schema";
import { calculateEffectiveTotal } from "@/lib/utils";
import type { MealType } from "@/app/orders/actions";

export type EventProfitability = {
  id: number;
  orderId: string;
  customerName: string | null;
  customerPhone: string | null;
  date: string;
  venue: string;
  mealType: MealType;
  revenue: number;
  clientPaid: number;
  clientWaived: number;
  clientBalance: number;
  vendorExpenses: number;
  netProfit: number;
};

export type CustomerReport = {
  id: string; // unique identifier (phone, name, or "unknown")
  customerName: string;
  customerPhone: string;
  totalOrders: number;
  totalRevenue: number;
  totalPaid: number;
  totalWaived: number;
  balanceDue: number;
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
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function getEventProfitabilityReport(): Promise<EventProfitability[]> {
  const allOrders = await db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
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
    const actualRevenue = Math.max(effectiveTotal, clientPaid + totalWaived);

    const relatedVendorPayments = allVendorPayments.filter(vp => vp.orderId === order.id);
    const vendorExpenses = relatedVendorPayments.reduce((sum, vp) => sum + vp.amount, 0);

    const netProfit = clientPaid - vendorExpenses;

    return {
      id: order.id,
      orderId: order.orderId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      date: toDateString(order.date),
      venue: order.venue,
      mealType: order.mealType,
      revenue: actualRevenue,
      clientPaid,
      clientWaived: totalWaived,
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

export async function getCustomerReport(): Promise<CustomerReport[]> {
  const allOrders = await db.query.orders.findMany({
    with: {
      orderPayments: true,
    },
  });

  const customerMap = new Map<string, CustomerReport>();

  for (const order of allOrders) {
    const customerPhone = order.customerPhone || "";
    const customerName = order.customerName || "";
    
    // Determine a unique key for the customer
    let key = "unknown";
    if (customerPhone) {
      key = customerPhone;
    } else if (customerName) {
      key = customerName;
    }

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: key,
        customerName: customerName || (customerPhone ? "Unknown Customer" : "Unknown Customer"),
        customerPhone: customerPhone,
        totalOrders: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalWaived: 0,
        balanceDue: 0,
      });
    }

    const report = customerMap.get(key)!;
    report.totalOrders += 1;

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

    const actualRevenue = Math.max(effectiveTotal, clientPaid + totalWaived);
    report.totalRevenue += actualRevenue;
    report.totalPaid += clientPaid;
    report.totalWaived += totalWaived;
  }

  const result = Array.from(customerMap.values()).map(report => {
    report.balanceDue = Math.max(0, report.totalRevenue - report.totalPaid - report.totalWaived);
    return report;
  });

  // Sort by highest revenue descending
  result.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return result;
}

export type VendorOrderReport = {
  orderId: string;
  orderDbId: number;
  date: string;
  venue: string;
  totalVendorPayments: number;
  vendors: {
    vendorId: number;
    vendorName: string;
    vendorPhone: string;
    deliveries: {
      rawMaterialName: string;
      unitQty: string;
      unitName: string;
      notes: string | null;
    }[];
    payments: {
      amount: number;
      date: string;
      notes: string | null;
    }[];
    totalPaid: number;
  }[];
};

export async function getVendorOrderReport(): Promise<VendorOrderReport[]> {
  const allOrders = await db.query.orders.findMany({
    orderBy: desc(orders.createdAt),
    with: {
      orderRawMaterials: {
        with: {
          rawMaterial: true,
          vendor: true,
        },
      },
      vendorPayments: {
        with: {
          vendor: true,
        },
      },
    },
  });

  return allOrders.map(order => {
    // Group by vendorId
    const vendorMap = new Map<number, VendorOrderReport["vendors"][0]>();

    for (const payment of order.vendorPayments) {
      if (!payment.vendor) continue;
      
      if (!vendorMap.has(payment.vendorId)) {
        vendorMap.set(payment.vendorId, {
          vendorId: payment.vendorId,
          vendorName: payment.vendor.name,
          vendorPhone: payment.vendor.phone,
          deliveries: [],
          payments: [],
          totalPaid: 0,
        });
      }

      const v = vendorMap.get(payment.vendorId)!;
      v.payments.push({
        amount: payment.amount,
        date: toDateString(payment.date),
        notes: payment.notes,
      });
      v.totalPaid += payment.amount;
    }

    for (const item of order.orderRawMaterials) {
      if (!item.vendor) continue;

      if (!vendorMap.has(item.vendorId!)) {
        vendorMap.set(item.vendorId!, {
          vendorId: item.vendorId!,
          vendorName: item.vendor.name,
          vendorPhone: item.vendor.phone,
          deliveries: [],
          payments: [],
          totalPaid: 0,
        });
      }

      const v = vendorMap.get(item.vendorId!)!;
      v.deliveries.push({
        rawMaterialName: item.rawMaterial?.name || "Unknown",
        unitQty: item.unitQty,
        unitName: item.unitName,
        notes: item.notes,
      });
    }

    const vendorsArray = Array.from(vendorMap.values());
    const totalVendorPayments = vendorsArray.reduce((sum, v) => sum + v.totalPaid, 0);

    return {
      orderId: order.orderId,
      orderDbId: order.id,
      date: toDateString(order.date),
      venue: order.venue,
      totalVendorPayments,
      vendors: vendorsArray,
    };
  });
}
