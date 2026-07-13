import type { Metadata } from "next";
import { Suspense } from "react";

import { getMaterials } from "@/app/raw-materials/actions";
import { PageHeader } from "@/components/page-header";
import { MaterialsView } from "@/components/raw-materials/materials-view";
import { SectionListSkeleton } from "@/components/section-list-skeleton";

export const metadata: Metadata = {
  title: "Raw Materials",
};

export const dynamic = "force-dynamic";

async function MaterialsContent() {
  const materials = await getMaterials();
  return <MaterialsView materials={materials} />;
}

export default function RawMaterialsPage() {
  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Raw Materials" />
      <Suspense fallback={<SectionListSkeleton />}>
        <MaterialsContent />
      </Suspense>
    </div>
  );
}
