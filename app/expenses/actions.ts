"use server";

import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, orderPayments, orderPaymentExpenses, vendors, vendorPayments } from "@/db/schema";
import { calculateCashPosition } from "@/lib/reports/cash-position";
import type { VendorPayment } from "@/lib/expenses/vendor-ledger";
import { parseOtherExpenseEntries, parseVendorExpenseEntries } from "@/lib/expenses/entry-batch";
import { parseCalendarDate, toCalendarDateString } from "@/lib/utils";

export type VendorDropdownItem = { id: number; name: string };
export type OrderSelectionItem = {
  id: number;
  orderId: string;
  date: string;
  venue: string;
  customerName: string | null;
};
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
export type OrderExpenseLedger = {
  order: OrderSelectionItem;
  payments: OrderPaymentRecord[];
  vendorPayments: VendorPayment[];
  linkedVendors: VendorDropdownItem[];
  summary: ReturnType<typeof calculateCashPosition>;
};

export async function getOrdersForSelection(): Promise<OrderSelectionItem[]> {
  const rows = await db.query.orders.findMany({
    orderBy: desc(orders.date),
    columns: {
      id: true,
      orderId: true,
      date: true,
      venue: true,
      customerName: true,
    },
  });
  return rows.map((order) => ({
    ...order,
    date: toCalendarDateString(order.date),
  }));
}

export async function getAllVendors(): Promise<VendorDropdownItem[]> {
  return db.query.vendors.findMany({
    orderBy: asc(vendors.name),
    columns: { id: true, name: true },
  });
}

export async function getOrderExpenseLedger(
  orderId: number,
): Promise<OrderExpenseLedger | null> {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) return null;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      orderPayments: {
        with: { expenses: true },
        orderBy: desc(orderPayments.date),
      },
      vendorPayments: {
        with: { vendor: true },
        orderBy: [desc(vendorPayments.date), desc(vendorPayments.createdAt)],
      },
      orderRawMaterials: { with: { vendor: true } },
    },
  });
  if (!order) return null;

  const linkedVendors = new Map<number, VendorDropdownItem>();
  for (const material of order.orderRawMaterials) {
    if (material.vendor) {
      linkedVendors.set(material.vendor.id, {
        id: material.vendor.id,
        name: material.vendor.name,
      });
    }
  }

  return {
    order: {
      id: order.id,
      orderId: order.orderId,
      date: toCalendarDateString(order.date),
      venue: order.venue,
      customerName: order.customerName,
    },
    summary: calculateCashPosition(order.orderPayments, order.vendorPayments),
    linkedVendors: [...linkedVendors.values()],
    payments: order.orderPayments.map((payment) => ({
      ...payment,
      date: toCalendarDateString(payment.date),
      expenses: payment.expenses.map((expense) => ({
        ...expense,
        date: toCalendarDateString(expense.date),
      })),
    })),
    vendorPayments: order.vendorPayments.map((payment) => ({
      id: payment.id,
      vendorId: payment.vendorId,
      vendorName: payment.vendor.name,
      amount: payment.amount,
      date: toCalendarDateString(payment.date),
      notes: payment.notes,
      orderPaymentId: payment.orderPaymentId,
    })),
  };
}

function validId(id: number) {
  return Number.isSafeInteger(id) && id > 0;
}
function entryDate(data: FormData): Date | null {
  const value = String(data.get("date") || "");
  if (!value) return new Date();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parseCalendarDate(value);
  return !Number.isNaN(date.getTime()) && toCalendarDateString(date) === value
    ? date
    : null;
}
function refreshOrder(orderId: number) {
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath(`/orders/${orderId}/finance`);
}

type ExpenseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function recordAgainstReceipt(
  orderId: number,
  orderPaymentId: number,
  save: (transaction: ExpenseTransaction) => Promise<string | null>,
) {
  return db.transaction(async (transaction) => {
    const [receipt] = await transaction.select({ id: orderPayments.id })
      .from(orderPayments)
      .where(and(
        eq(orderPayments.id, orderPaymentId),
        eq(orderPayments.orderId, orderId),
        eq(orderPayments.isWaived, false),
      ))
      .for("update");
    if (!receipt) return { error: "That client payment is no longer available for this order. Refresh and choose another." };
    const error = await save(transaction);
    return error ? { error } : { success: true as const };
  });
}

export async function createExpenses(data: FormData) {
  const orderId = Number(data.get("orderId"));
  const orderPaymentId = Number(data.get("orderPaymentId"));
  if (!validId(orderId) || !validId(orderPaymentId)) {
    return { error: "Choose an order and a client payment received." };
  }
  const parsed = parseOtherExpenseEntries(data);
  if (!parsed.entries) return { error: parsed.error };
  const date = entryDate(data);
  if (!date) return { error: "Enter a valid date." };
  const entries = parsed.entries;
  try {
    const result = await recordAgainstReceipt(orderId, orderPaymentId, async (transaction) => {
      await transaction.insert(orderPaymentExpenses).values(
        entries.map((entry) => ({ ...entry, orderPaymentId, date })),
      );
      return null;
    });
    if (result.error) return result;
    refreshOrder(orderId);
    return { success: true as const, count: entries.length };
  } catch (error) {
    console.error("Expense entry failed:", error);
    return { error: "Could not save the expenses. Please try again." };
  }
}

export async function createExpense(data: FormData) {
  return createExpenses(data);
}

export async function deleteExpense(data: FormData) {
  const id = Number(data.get("id"));
  const orderId = Number(data.get("orderId"));
  if (!validId(id) || !validId(orderId)) {
    return { error: "Choose an expense from this order." };
  }
  try {
    const receipts = await db.query.orderPayments.findMany({
      where: eq(orderPayments.orderId, orderId),
      columns: { id: true },
    });
    if (!receipts.length) {
      return { error: "This order has no expenses to remove." };
    }
    const removed = await db
      .delete(orderPaymentExpenses)
      .where(
        and(
          eq(orderPaymentExpenses.id, id),
          inArray(
            orderPaymentExpenses.orderPaymentId,
            receipts.map((receipt) => receipt.id),
          ),
        ),
      )
      .returning({ id: orderPaymentExpenses.id });
    if (!removed.length) {
      return { error: "That expense is no longer available. Refresh the ledger." };
    }
    refreshOrder(orderId);
    return { success: true };
  } catch (error) {
    console.error("Expense removal failed:", error);
    return { error: "Could not remove the expense. Please try again." };
  }
}

export async function createVendorPaymentsForExpenses(data: FormData) {
  const orderId = Number(data.get("orderId"));
  const orderPaymentId = Number(data.get("orderPaymentId"));
  if (!validId(orderId) || !validId(orderPaymentId)) {
    return { error: "Choose an order and a client payment received." };
  }
  const parsed = parseVendorExpenseEntries(data);
  if (!parsed.entries) return { error: parsed.error };
  const date = entryDate(data);
  if (!date) return { error: "Enter a valid date." };
  const notes = String(data.get("notes") || "").trim() || null;
  if (notes && notes.length > 240) return { error: "Keep notes within 240 characters." };
  const entries = parsed.entries;
  try {
    const result = await recordAgainstReceipt(orderId, orderPaymentId, async (transaction) => {
      const found = await transaction.query.vendors.findMany({
        where: inArray(vendors.id, entries.map((entry) => entry.vendorId)),
        columns: { id: true },
      });
      if (found.length !== entries.length) return "A vendor is no longer available. Refresh the form and try again.";
      await transaction.insert(vendorPayments).values(
        entries.map((entry) => ({ ...entry, orderId, orderPaymentId, date, notes })),
      );
      return null;
    });
    if (result.error) return result;
    refreshOrder(orderId);
    for (const entry of entries) revalidatePath(`/vendors/${entry.vendorId}/finance`);
    return { success: true as const, count: entries.length };
  } catch (error) {
    console.error("Vendor payment entry failed:", error);
    return { error: "Could not save the vendor payments. Check the order and vendors, then try again." };
  }
}

export async function createVendorPaymentForExpenses(data: FormData) {
  return createVendorPaymentsForExpenses(data);
}
