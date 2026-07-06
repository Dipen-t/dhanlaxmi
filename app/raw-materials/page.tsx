import type { Metadata } from "next";

import { getMaterials } from "@/app/raw-materials/actions";
import { PageHeader } from "@/components/page-header";
import { MaterialsView } from "@/components/raw-materials/materials-view";

export const metadata: Metadata = {
  title: "Raw Materials",
};

export const dynamic = "force-dynamic";

export default async function RawMaterialsPage() {
  const materials = await getMaterials();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Raw Materials" />
      <MaterialsView materials={materials} />
    </div>
  );
}
