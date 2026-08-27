"use server";

import { db } from "@/db";
import { pdfTemplates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPdfTemplates(themeType?: string) {
  if (themeType) {
    return await db.query.pdfTemplates.findMany({
      where: eq(pdfTemplates.themeType, themeType),
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
  const themeType = data.get("themeType") as string;
  const fontFamily = data.get("fontFamily") as string;
  const fontSize = data.get("fontSize") as string;

  if (!name || !themeType || !fontFamily || !fontSize) {
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
          themeType,
          fontFamily,
          fontSize,
          updatedAt: new Date(),
        })
        .where(eq(pdfTemplates.id, id));
    } else {
      // Insert
      await db.insert(pdfTemplates).values({
        name,
        themeType,
        fontFamily,
        fontSize,
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
