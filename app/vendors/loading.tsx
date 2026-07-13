import { PageHeader } from "@/components/page-header";
import { SectionListSkeleton } from "@/components/section-list-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader title="Vendors" />
      <SectionListSkeleton />
    </div>
  );
}
