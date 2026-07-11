import { asc } from "drizzle-orm";

import { db } from "@/db";
import { rawMaterials } from "@/db/schema";

export async function getRawMaterials() {
  return db.query.rawMaterials.findMany({
    with: { rawMaterialVendors: { with: { vendor: true } } },
    orderBy: asc(rawMaterials.name),
  });
}

export type RawMaterialWithVendor = Awaited<
  ReturnType<typeof getRawMaterials>
>[number];
