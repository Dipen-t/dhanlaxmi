import type { MaterialWithVendor } from "@/app/raw-materials/actions";

import { MaterialActions, VendorBadge } from "./material-actions";

type MaterialGridProps = {
  materials: MaterialWithVendor[];
  onEdit: (material: MaterialWithVendor) => void;
};

export function MaterialGrid({ materials, onEdit }: MaterialGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {materials.map((material) => (
        <li key={material.id}>
          <article className="flex h-full flex-col rounded-xl border border-border bg-background p-4 sm:p-5">
            <button
              type="button"
              onClick={() => onEdit(material)}
              className="min-w-0 flex-1 touch-manipulation rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-base font-semibold text-foreground text-pretty md:text-lg">
                {material.name}
              </p>
              <div className="mt-3">
                <VendorBadge material={material} />
              </div>
            </button>

            <div className="mt-4 border-t border-border pt-3">
              <MaterialActions
                material={material}
                onEdit={onEdit}
                layout="stacked"
              />
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
