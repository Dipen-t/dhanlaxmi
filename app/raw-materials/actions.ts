"use server";

import { asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { rawMaterials } from "@/db/schema";

export type MaterialWithVendor = {
  id: number;
  name: string;
  rawMaterialVendors: { vendor: { id: number; name: string } }[];
};

export async function getMaterials(sortForOrders = false): Promise<MaterialWithVendor[]> {
  return db.query.rawMaterials.findMany({
    with: { rawMaterialVendors: { with: { vendor: true } } },
    orderBy: sortForOrders ? [asc(rawMaterials.sortOrder), asc(rawMaterials.name)] : asc(rawMaterials.name),
  });
}

export async function saveOrderMaterialArrangement(ids: number[]) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 10000 || new Set(ids).size !== ids.length || ids.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
    return { error: "The kitchen item arrangement is invalid. Reload the form and try again." };
  }
  try {
    const positions = ids.map((id, index) => sql`when ${id} then ${index}`);
    await db.transaction(async (transaction) => {
      const updated = await transaction.update(rawMaterials)
        .set({ sortOrder: sql`case ${rawMaterials.id} ${sql.join(positions, sql` `)} else ${rawMaterials.sortOrder} end` })
        .where(inArray(rawMaterials.id, ids))
        .returning({ id: rawMaterials.id });
      if (updated.length !== ids.length) throw new Error("A kitchen item was removed.");
    });
    revalidatePath("/orders/new");
    revalidatePath("/orders/[id]/edit", "page");
    return { success: true as const };
  } catch {
    return { error: "Could not save the kitchen item arrangement. Check your connection and try again." };
  }
}

function normalizeName(name: string) {
  return name.trim();
}

function validateName(name: string) {
  if (!name) {
    return "Material name is required.";
  }
  if (name.length > 120) {
    return "Material name must be 120 characters or less.";
  }
  return null;
}

export async function createMaterial(formData: FormData) {
  const name = normalizeName(String(formData.get("name") ?? ""));

  const error = validateName(name);
  if (error) {
    return { error };
  }

  try {
    await db.insert(rawMaterials).values({ name });
    revalidatePath("/raw-materials");
    return { success: true as const };
  } catch {
    return { error: "A material with this name already exists." };
  }
}

export async function updateMaterial(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = normalizeName(String(formData.get("name") ?? ""));

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid material." };
  }

  const error = validateName(name);
  if (error) {
    return { error };
  }

  try {
    const [updated] = await db
      .update(rawMaterials)
      .set({ name })
      .where(eq(rawMaterials.id, id))
      .returning({ id: rawMaterials.id });

    if (!updated) {
      return { error: "Material not found." };
    }

    revalidatePath("/raw-materials");
    return { success: true as const };
  } catch {
    return { error: "A material with this name already exists." };
  }
}

export async function deleteMaterial(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!id || Number.isNaN(id)) {
    return { error: "Invalid material." };
  }

  const [deleted] = await db
    .delete(rawMaterials)
    .where(eq(rawMaterials.id, id))
    .returning({ id: rawMaterials.id });

  if (!deleted) {
    return { error: "Material not found." };
  }

  revalidatePath("/raw-materials");
  return { success: true as const };
}
