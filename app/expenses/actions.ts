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
  orderId: number;
  orderPaymentId: number | null;
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
};
export type OrderExpenseLedger = {
  order: OrderSelectionItem;
  payments: OrderPaymentRecord[];
  otherExpenses: OrderPaymentExpenseRecord[];
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
        orderBy: desc(orderPayments.date),
      },
      orderPaymentExpenses: {
        orderBy: [desc(orderPaymentExpenses.date), desc(orderPaymentExpenses.id)],
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

  const payments = order.orderPayments.map((payment) => ({
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    date: toCalendarDateString(payment.date),
    isWaived: payment.isWaived,
    notes: payment.notes,
  }));
  const otherExpenses = order.orderPaymentExpenses.map((expense) => ({
    id: expense.id,
    orderId: expense.orderId,
    orderPaymentId: expense.orderPaymentId,
    amount: expense.amount,
    description: expense.description,
    date: toCalendarDateString(expense.date),
  }));
  const mappedVendorPayments = order.vendorPayments.map((payment) => ({
    id: payment.id,
    vendorId: payment.vendorId,
    vendorName: payment.vendor.name,
    amount: payment.amount,
    date: toCalendarDateString(payment.date),
    notes: payment.notes,
    orderPaymentId: payment.orderPaymentId,
  }));

  return {
    order: {
      id: order.id,
      orderId: order.orderId,
      date: toCalendarDateString(order.date),
      venue: order.venue,
      customerName: order.customerName,
    },
    summary: calculateCashPosition(payments, mappedVendorPayments, otherExpenses),
    linkedVendors: [...linkedVendors.values()],
    payments,
    otherExpenses,
    vendorPayments: mappedVendorPayments,
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

async function assertOrderExists(orderId: number) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { id: true },
  });
  return Boolean(order);
}

/** Save vendor payments and/or other expenses against the order total in one submit. */
export async function createOrderSpend(data: FormData) {
  const orderId = Number(data.get("orderId"));
  if (!validId(orderId)) return { error: "Choose an order." };
  if (!(await assertOrderExists(orderId))) {
    return { error: "This order is no longer available. Choose another order." };
  }

  const hasVendorRows = data.getAll("vendorId").length > 0;
  const otherAmountKeys = data.getAll("expenseAmount").length
    ? data.getAll("expenseAmount")
    : hasVendorRows
      ? []
      : data.getAll("amount");
  const vendorTouched =
    hasVendorRows && data.getAll("amount").some((value) => String(value).trim());
  const otherTouched = data
    .getAll("description")
    .some((value, index) => String(value).trim() || String(otherAmountKeys[index] ?? "").trim());

  let vendorEntries: { vendorId: number; amount: number }[] = [];
  if (hasVendorRows) {
    const vendorParsed = parseVendorExpenseEntries(data);
    if (vendorParsed.entries) vendorEntries = vendorParsed.entries;
    else if (vendorTouched) return { error: vendorParsed.error };
  }

  let otherEntries: { description: string; amount: number }[] = [];
  if (otherTouched || (!hasVendorRows && data.getAll("description").length > 0)) {
    const otherParsed = parseOtherExpenseEntries(data);
    if (otherParsed.entries) otherEntries = otherParsed.entries;
    else if (otherTouched || !vendorEntries.length) return { error: otherParsed.error };
  }

  if (!vendorEntries.length && !otherEntries.length) {
    return { error: "Enter at least one vendor amount or other expense." };
  }

  const date = entryDate(data);
  if (!date) return { error: "Enter a valid date." };
  const notes = String(data.get("notes") || "").trim() || null;
  if (notes && notes.length > 240) return { error: "Keep notes within 240 characters." };

  try {
    await db.transaction(async (transaction) => {
      if (vendorEntries.length) {
        const found = await transaction.query.vendors.findMany({
          where: inArray(vendors.id, vendorEntries.map((entry) => entry.vendorId)),
          columns: { id: true },
        });
        if (found.length !== vendorEntries.length) {
          throw new Error("VENDOR_MISSING");
        }
        await transaction.insert(vendorPayments).values(
          vendorEntries.map((entry) => ({
            ...entry,
            orderId,
            orderPaymentId: null,
            date,
            notes,
          })),
        );
      }
      if (otherEntries.length) {
        await transaction.insert(orderPaymentExpenses).values(
          otherEntries.map((entry) => ({
            ...entry,
            orderId,
            orderPaymentId: null,
            date,
          })),
        );
      }
    });
    refreshOrder(orderId);
    for (const entry of vendorEntries) revalidatePath(`/vendors/${entry.vendorId}/finance`);
    return {
      success: true as const,
      vendorCount: vendorEntries.length,
      otherCount: otherEntries.length,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "VENDOR_MISSING") {
      return { error: "A vendor is no longer available. Refresh the form and try again." };
    }
    console.error("Order spend entry failed:", error);
    return { error: "Could not save these expenses. Please try again." };
  }
}

export async function createExpenses(data: FormData) {
  return createOrderSpend(data);
}

export async function createExpense(data: FormData) {
  return createOrderSpend(data);
}

export async function createVendorPaymentsForExpenses(data: FormData) {
  return createOrderSpend(data);
}

export async function createVendorPaymentForExpenses(data: FormData) {
  return createOrderSpend(data);
}

export async function deleteExpense(data: FormData) {
  const id = Number(data.get("id"));
  const orderId = Number(data.get("orderId"));
  if (!validId(id) || !validId(orderId)) {
    return { error: "Choose an expense from this order." };
  }
  try {
    const removed = await db
      .delete(orderPaymentExpenses)
      .where(
        and(eq(orderPaymentExpenses.id, id), eq(orderPaymentExpenses.orderId, orderId)),
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

export async function updateLedgerEntry(data: FormData) {
  const id = Number(data.get("id"));
  const orderId = Number(data.get("orderId"));
  const kind = data.get("kind");
  const date = entryDate(data);
  if (!validId(id) || !validId(orderId) || !["vendor", "expense"].includes(String(kind))) {
    return { error: "Choose an entry from this order." };
  }
  if (!date) return { error: "Enter a valid date." };
  try {
    if (kind === "vendor") {
      const parsed = parseVendorExpenseEntries(data);
      if (!parsed.entries || parsed.entries.length !== 1) {
        return { error: parsed.error || "Choose one vendor and amount." };
      }
      const notes = String(data.get("notes") || "").trim() || null;
      if (notes && notes.length > 240) return { error: "Keep notes within 240 characters." };
      const entry = parsed.entries[0];
      const result = await db.transaction(async (transaction) => {
        const [existing] = await transaction
          .select()
          .from(vendorPayments)
          .where(and(eq(vendorPayments.id, id), eq(vendorPayments.orderId, orderId)))
          .for("update");
        if (!existing) return { error: "That vendor payment is no longer available for this order." };
        const vendor = await transaction.query.vendors.findFirst({
          where: eq(vendors.id, entry.vendorId),
        });
        if (!vendor) return { error: "That vendor is no longer available." };
        await transaction
          .update(vendorPayments)
          .set({ ...entry, date, notes, updatedAt: new Date() })
          .where(eq(vendorPayments.id, id));
        return { oldVendorId: existing.vendorId };
      });
      if ("error" in result) return result;
      revalidatePath(`/vendors/${result.oldVendorId}/finance`);
      revalidatePath(`/vendors/${entry.vendorId}/finance`);
    } else {
      const parsed = parseOtherExpenseEntries(data);
      if (!parsed.entries || parsed.entries.length !== 1) {
        return { error: parsed.error || "Enter one expense description and amount." };
      }
      const result = await db.transaction(async (transaction) => {
        const [existing] = await transaction
          .select({ id: orderPaymentExpenses.id })
          .from(orderPaymentExpenses)
          .where(
            and(eq(orderPaymentExpenses.id, id), eq(orderPaymentExpenses.orderId, orderId)),
          )
          .for("update");
        if (!existing) return { error: "That expense is no longer available for this order." };
        await transaction
          .update(orderPaymentExpenses)
          .set({ ...parsed.entries![0], date })
          .where(eq(orderPaymentExpenses.id, id));
        return { success: true as const };
      });
      if ("error" in result) return result;
    }
    refreshOrder(orderId);
    return { success: true };
  } catch {
    return { error: "Could not update the entry. Refresh the ledger and try again." };
  }
}

export async function deleteVendorExpense(data: FormData) {
  const id = Number(data.get("id"));
  const orderId = Number(data.get("orderId"));
  if (!validId(id) || !validId(orderId)) {
    return { error: "Choose a vendor payment from this order." };
  }
  try {
    const [removed] = await db
      .delete(vendorPayments)
      .where(and(eq(vendorPayments.id, id), eq(vendorPayments.orderId, orderId)))
      .returning({ vendorId: vendorPayments.vendorId });
    if (!removed) return { error: "That vendor payment is no longer available for this order." };
    refreshOrder(orderId);
    revalidatePath(`/vendors/${removed.vendorId}/finance`);
    return { success: true };
  } catch {
    return { error: "Could not delete the vendor payment. Please try again." };
  }
}
