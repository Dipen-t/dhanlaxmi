"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { vendorPayments, vendors } from "@/db/schema";

export type VendorPaymentRecord = {
  id: number;
  vendorId: number;
  amount: number;
  date: string;
  notes: string | null;
};

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getVendorFinances(vendorId: string): Promise<VendorPaymentRecord[]> {
  const numericId = Number(vendorId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return [];
  }

  const payments = await db.query.vendorPayments.findMany({
    where: eq(vendorPayments.vendorId, numericId),
    orderBy: (vendorPayments, { desc }) => [desc(vendorPayments.date)],
  });

  return payments.map(p => ({
    ...p,
    date: toDateString(p.date),
  }));
}

export async function createVendorPayment(data: FormData) {
  const vendorId = Number(data.get("vendorId"));
  const amount = Number(data.get("amount"));
  const date = data.get("date") as string;
  const notes = data.get("notes") as string || null;

  if (!vendorId || !amount || !date) {
    return { error: "Missing required fields" };
  }

  try {
    await db.insert(vendorPayments).values({
      vendorId,
      amount,
      date: new Date(date),
      notes,
    });
    revalidatePath(`/vendors/${vendorId}/finance`);
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to create payment out" };
  }
}
