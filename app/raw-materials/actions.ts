"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { rawMaterials } from "@/db/schema";

export type MaterialWithVendor = {
  id: number;
  name: string;
  vendorId: number | null;
  vendor: { id: number; name: string } | null;
};

export async function getMaterials(): Promise<MaterialWithVendor[]> {
  return db.query.rawMaterials.findMany({
    with: { vendor: true },
    orderBy: asc(rawMaterials.name),
  });
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
