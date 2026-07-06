import type { MaterialWithVendor } from "@/app/raw-materials/actions";

import { MaterialActions, VendorBadge } from "./material-actions";

type MaterialGridProps = {
  materials: MaterialWithVendor[];
  onEdit: (material: MaterialWithVendor) => void;
};

export function MaterialGrid({ materials, onEdit }: MaterialGridProps) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
      {materials.map((material) => (
        <li
          key={material.id}
          className="flex flex-col rounded-xl border border-border bg-background p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground [text-wrap:pretty]">
              {material.name}
            </p>
            <div className="mt-2">
              <VendorBadge material={material} />
            </div>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <MaterialActions
              material={material}
              onEdit={onEdit}
              layout="stacked"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
