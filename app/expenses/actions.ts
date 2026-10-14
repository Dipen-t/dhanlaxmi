"use server";

import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, orderPayments, orderPaymentExpenses, vendors, vendorPayments } from "@/db/schema";
import { calculateCashPosition } from "@/lib/reports/cash-position";
import type { VendorPayment } from "@/lib/expenses/vendor-ledger";

export type VendorDropdownItem = { id: number; name: string };
export type OrderSelectionItem = { id: number; orderId: string; date: string; venue: string };
export type OrderPaymentExpenseRecord = { id: number; orderPaymentId: number; amount: number; description: string; date: string };
export type OrderPaymentRecord = {
  id: number; orderId: number; amount: number; date: string; isWaived: boolean;
  notes: string | null; expenses: OrderPaymentExpenseRecord[];
};
export type OrderExpenseLedger = {
  payments: OrderPaymentRecord[];
  vendorPayments: VendorPayment[];
  linkedVendors: VendorDropdownItem[];
  summary: ReturnType<typeof calculateCashPosition>;
};

export async function getOrdersForSelection(): Promise<OrderSelectionItem[]> {
  const rows = await db.query.orders.findMany({
    orderBy: desc(orders.date), columns: { id: true, orderId: true, date: true, venue: true },
  });
  return rows.map(order => ({ ...order, date: order.date.toISOString().slice(0, 10) }));
}

export async function getAllVendors(): Promise<VendorDropdownItem[]> {
  return db.query.vendors.findMany({ orderBy: asc(vendors.name), columns: { id: true, name: true } });
}

export async function getOrderExpenseLedger(orderId: number): Promise<OrderExpenseLedger | null> {
  if (!Number.isSafeInteger(orderId) || orderId <= 0) return null;
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      orderPayments: { with: { expenses: true }, orderBy: desc(orderPayments.date) },
      vendorPayments: { with: { vendor: true }, orderBy: [desc(vendorPayments.date), desc(vendorPayments.createdAt)] },
      orderRawMaterials: { with: { vendor: true } },
    },
  });
  if (!order) return null;
  const linkedVendors = new Map<number, VendorDropdownItem>();
  for (const material of order.orderRawMaterials) {
    if (material.vendor) linkedVendors.set(material.vendor.id, { id: material.vendor.id, name: material.vendor.name });
  }
  return {
    summary: calculateCashPosition(order.orderPayments, order.vendorPayments),
    linkedVendors: [...linkedVendors.values()],
    payments: order.orderPayments.map(payment => ({
      ...payment, date: payment.date.toISOString().slice(0, 10),
      expenses: payment.expenses.map(expense => ({ ...expense, date: expense.date.toISOString().slice(0, 10) })),
    })),
    vendorPayments: order.vendorPayments.map(payment => ({
      id: payment.id, vendorId: payment.vendorId, vendorName: payment.vendor.name,
      amount: payment.amount, date: payment.date.toISOString().slice(0, 10), notes: payment.notes,
    })),
  };
}

function validId(id: number) { return Number.isSafeInteger(id) && id > 0; }
function validAmount(amount: number) { return Number.isInteger(amount) && amount > 0 && amount <= 2147483647; }
function entryDate(data: FormData): Date | null {
  const value = String(data.get("date") || "");
  if (!value) return new Date();
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
function refreshOrder(orderId: number) {
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath(`/orders/${orderId}/finance`);
}

export async function createExpense(data: FormData) {
  const orderId = Number(data.get("orderId"));
  const orderPaymentId = Number(data.get("orderPaymentId"));
  const amount = Number(data.get("amount"));
  const description = String(data.get("description") || "").trim();
  const date = entryDate(data);
  if (!validId(orderId) || !validId(orderPaymentId)) return { error: "Choose an order and a client payment received." };
  if (!validAmount(amount)) return { error: "Enter a positive whole-rupee amount." };
  if (!description || description.length > 240) return { error: "Enter a description of up to 240 characters." };
  if (!date) return { error: "Enter a valid date." };
  try {
    const receipt = await db.query.orderPayments.findFirst({
      where: and(eq(orderPayments.id, orderPaymentId), eq(orderPayments.orderId, orderId), eq(orderPayments.isWaived, false)),
      columns: { id: true },
    });
    if (!receipt) return { error: "That client payment is no longer available for this order. Refresh and choose another." };
    await db.insert(orderPaymentExpenses).values({ orderPaymentId, amount, description, date });
    refreshOrder(orderId);
    return { success: true };
  } catch (error) {
    console.error("Expense entry failed:", error);
    return { error: "Could not save the expense. Please try again." };
  }
}

export async function deleteExpense(data: FormData) {
  const id = Number(data.get("id"));
  const orderId = Number(data.get("orderId"));
  if (!validId(id) || !validId(orderId)) return { error: "Choose an expense from this order." };
  try {
    const receipts = await db.query.orderPayments.findMany({ where: eq(orderPayments.orderId, orderId), columns: { id: true } });
    if (!receipts.length) return { error: "This order has no expenses to remove." };
    const removed = await db.delete(orderPaymentExpenses)
      .where(and(eq(orderPaymentExpenses.id, id), inArray(orderPaymentExpenses.orderPaymentId, receipts.map(receipt => receipt.id))))
      .returning({ id: orderPaymentExpenses.id });
    if (!removed.length) return { error: "That expense is no longer available. Refresh the ledger." };
    refreshOrder(orderId);
    return { success: true };
  } catch (error) {
    console.error("Expense removal failed:", error);
    return { error: "Could not remove the expense. Please try again." };
  }
}

export async function createVendorPaymentForExpenses(data: FormData) {
  const vendorId = Number(data.get("vendorId"));
  const orderId = Number(data.get("orderId"));
  const amount = Number(data.get("amount"));
  const date = entryDate(data);
  const notes = String(data.get("notes") || "").trim() || null;
  if (!validId(vendorId) || !validId(orderId)) return { error: "Choose an order and vendor." };
  if (!validAmount(amount)) return { error: "Enter a positive whole-rupee amount." };
  if (!date) return { error: "Enter a valid date." };
  if (notes && notes.length > 240) return { error: "Keep notes within 240 characters." };
  try {
    await db.insert(vendorPayments).values({ vendorId, orderId, amount, date, notes });
    refreshOrder(orderId);
    revalidatePath(`/vendors/${vendorId}/finance`);
    return { success: true };
  } catch (error) {
    console.error("Vendor payment entry failed:", error);
    return { error: "Could not save the vendor payment. Check the order and vendor, then try again." };
  }
}
