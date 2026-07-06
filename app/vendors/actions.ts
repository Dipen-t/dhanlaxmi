"use server";

import { asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { rawMaterials, vendors } from "@/db/schema";

import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import { getMaterials } from "@/app/raw-materials/actions";

export type DeliveryLocation = "venue" | "godown";

export type VendorWithMaterials = {
  id: number;
  name: string;
  phone: string;
  deliveryLocation: DeliveryLocation;
  rawMaterials: { id: number; name: string }[];
};

export type VendorsPageData = {
  vendors: VendorWithMaterials[];
  materials: MaterialWithVendor[];
};

export async function getVendorsPageData(): Promise<VendorsPageData> {
  const [vendorRows, materials] = await Promise.all([
    db.query.vendors.findMany({
      with: { rawMaterials: true },
      orderBy: asc(vendors.name),
    }),
    getMaterials(),
  ]);

  return {
    vendors: vendorRows.map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      phone: vendor.phone,
      deliveryLocation: vendor.deliveryLocation,
      rawMaterials: vendor.rawMaterials
        .map((material) => ({ id: material.id, name: material.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    })),
    materials,
  };
}

function normalizeText(value: string) {
  return value.trim();
}

function validateVendorFields(name: string, phone: string, deliveryLocation: string) {
  if (!name) {
    return "Vendor name is required.";
  }
  if (name.length > 120) {
    return "Vendor name must be 120 characters or less.";
  }
  if (!phone) {
    return "Phone number is required.";
  }
  if (phone.length > 20) {
    return "Phone number must be 20 characters or less.";
  }
  if (!/^[\d+\s()-]+$/.test(phone)) {
    return "Phone number can only contain digits, spaces, and + ( ) -";
  }
  if (deliveryLocation !== "venue" && deliveryLocation !== "godown") {
    return "Select a delivery location.";
  }
  return null;
}

function parseMaterialIds(formData: FormData) {
  return formData
    .getAll("materialIds")
    .map((value) => Number(value))
    .filter((id) => !Number.isNaN(id));
}

async function syncVendorMaterials(vendorId: number, materialIds: number[]) {
  const uniqueIds = [...new Set(materialIds)];

  if (uniqueIds.length > 0) {
    const selectedMaterials = await db.query.rawMaterials.findMany({
      where: inArray(rawMaterials.id, uniqueIds),
    });

    if (selectedMaterials.length !== uniqueIds.length) {
      return { error: "One or more selected materials no longer exist." };
    }

    for (const material of selectedMaterials) {
      if (material.vendorId !== null && material.vendorId !== vendorId) {
        return {
          error: `"${material.name}" is already assigned to another vendor.`,
        };
      }
    }
  }

  await db
    .update(rawMaterials)
    .set({ vendorId: null })
    .where(eq(rawMaterials.vendorId, vendorId));

  if (uniqueIds.length > 0) {
    await db
      .update(rawMaterials)
      .set({ vendorId })
      .where(inArray(rawMaterials.id, uniqueIds));
  }

  return { success: true as const };
}

function revalidateVendorPaths() {
  revalidatePath("/vendors");
  revalidatePath("/raw-materials");
}

export async function createVendor(formData: FormData) {
  const name = normalizeText(String(formData.get("name") ?? ""));
  const phone = normalizeText(String(formData.get("phone") ?? ""));
  const deliveryLocation = String(formData.get("deliveryLocation") ?? "");
  const materialIds = parseMaterialIds(formData);

  const error = validateVendorFields(name, phone, deliveryLocation);
  if (error) {
    return { error };
  }

  const [created] = await db
    .insert(vendors)
    .values({
      name,
      phone,
      deliveryLocation: deliveryLocation as DeliveryLocation,
    })
    .returning({ id: vendors.id });

  const syncResult = await syncVendorMaterials(created.id, materialIds);
  if (syncResult.error) {
    await db.delete(vendors).where(eq(vendors.id, created.id));
    return { error: syncResult.error };
  }

  revalidateVendorPaths();
  return { success: true as const };
}

export async function updateVendor(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = normalizeText(String(formData.get("name") ?? ""));
  const phone = normalizeText(String(formData.get("phone") ?? ""));
  const deliveryLocation = String(formData.get("deliveryLocation") ?? "");
  const materialIds = parseMaterialIds(formData);

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid vendor." };
  }

  const error = validateVendorFields(name, phone, deliveryLocation);
  if (error) {
    return { error };
  }

  const [updated] = await db
    .update(vendors)
    .set({
      name,
      phone,
      deliveryLocation: deliveryLocation as DeliveryLocation,
      updatedAt: new Date(),
    })
    .where(eq(vendors.id, id))
    .returning({ id: vendors.id });

  if (!updated) {
    return { error: "Vendor not found." };
  }

  const syncResult = await syncVendorMaterials(id, materialIds);
  if (syncResult.error) {
    return { error: syncResult.error };
  }

  revalidateVendorPaths();
  return { success: true as const };
}

export async function deleteVendor(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid vendor." };
  }

  const [deleted] = await db
    .delete(vendors)
    .where(eq(vendors.id, id))
    .returning({ id: vendors.id });

  if (!deleted) {
    return { error: "Vendor not found." };
  }

  revalidateVendorPaths();
  return { success: true as const };
}
