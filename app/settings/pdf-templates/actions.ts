"use server";

import { db } from "@/db";
import { pdfTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPdfTemplates(type?: string) {
  if (type) {
    return await db.query.pdfTemplates.findMany({
      where: eq(pdfTemplates.type, type),
      orderBy: (pdfTemplates, { desc }) => [desc(pdfTemplates.createdAt)],
    });
  }
  return await db.query.pdfTemplates.findMany({
    orderBy: (pdfTemplates, { desc }) => [desc(pdfTemplates.createdAt)],
  });
}

export async function getPdfTemplate(id: number) {
  const result = await db.query.pdfTemplates.findFirst({
    where: eq(pdfTemplates.id, id),
  });
  return result || null;
}

export async function savePdfTemplate(data: FormData) {
  const idStr = data.get("id") as string;
  const name = data.get("name") as string;
  const type = data.get("type") as string;
  const templateJson = data.get("templateJson") as string;
  const basePdf = data.get("basePdf") as string | null;

  if (!name || !type || !templateJson) {
    return { error: "Missing required fields" };
  }

  try {
    if (idStr) {
      // Update
      const id = Number(idStr);
      await db
        .update(pdfTemplates)
        .set({
          name,
          type,
          templateJson,
          basePdf,
          updatedAt: new Date(),
        })
        .where(eq(pdfTemplates.id, id));
    } else {
      // Insert
      await db.insert(pdfTemplates).values({
        name,
        type,
        templateJson,
        basePdf,
      });
    }

    revalidatePath("/settings/pdf-templates");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to save template" };
  }
}

export async function deletePdfTemplate(id: number) {
  try {
    await db.delete(pdfTemplates).where(eq(pdfTemplates.id, id));
    revalidatePath("/settings/pdf-templates");
    return { success: true };
  } catch (e: any) {
    return { error: e.message || "Failed to delete template" };
  }
}
