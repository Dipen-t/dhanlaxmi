import type { MaterialWithVendor } from "@/app/raw-materials/actions";

import { MaterialActions, VendorBadge } from "./material-actions";

type MaterialListProps = {
  materials: MaterialWithVendor[];
  onEdit: (material: MaterialWithVendor) => void;
};

export function MaterialList({ materials, onEdit }: MaterialListProps) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {materials.map((material) => (
        <li
          key={material.id}
          className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4"
        >
          <p className="min-w-0 flex-1 text-sm font-semibold text-foreground [text-wrap:pretty]">
            {material.name}
          </p>
          <VendorBadge material={material} />
          <MaterialActions material={material} onEdit={onEdit} />
        </li>
      ))}
    </ul>
  );
}
