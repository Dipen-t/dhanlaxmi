"use client";

import { Pencil, Trash2 } from "lucide-react";

import { VendorBadge } from "@/components/raw-materials/vendor-badge";
import type { RawMaterialWithVendor } from "@/lib/raw-materials/queries";

type MaterialCardProps = {
  material: RawMaterialWithVendor;
  onEdit: (material: RawMaterialWithVendor) => void;
  onDelete: (material: RawMaterialWithVendor) => void;
};

export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-background p-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-foreground [text-wrap:balance]">
          {material.name}
        </h2>
        <div className="mt-2">
          <VendorBadge vendorName={material.vendor?.name ?? null} />
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onEdit(material)}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(material)}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
          Delete
        </button>
      </div>
    </article>
  );
}
