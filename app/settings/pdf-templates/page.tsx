import { PageHeader } from "@/components/page-header";
import { getPdfTemplates } from "./actions";
import { PdfTemplatesClient } from "./client";

export default async function PdfTemplatesPage() {
  const templates = await getPdfTemplates();

  return (
    <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 max-w-[1600px]">
      <PageHeader title="PDF Templates" />
      <PdfTemplatesClient initialTemplates={templates} />
    </div>
  );
}
