import type { VendorWithMaterials } from "@/app/vendors/actions";

import {
  DeliveryBadge,
  MaterialsSummary,
  VendorActions,
} from "./vendor-actions";
import { MaterialTagsGrid } from "./material-tags-grid";

type VendorGridProps = {
  vendors: VendorWithMaterials[];
  onEdit: (vendor: VendorWithMaterials) => void;
  onFinance: (vendor: VendorWithMaterials) => void;
};

export function VendorGrid({ vendors, onEdit, onFinance }: VendorGridProps) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {vendors.map((vendor) => (
        <li
          key={vendor.id}
          className="flex flex-col rounded-xl border border-border bg-background p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground [text-wrap:pretty]">
              {vendor.name}
            </p>
            <p className="mt-1 text-sm text-muted">{vendor.phone}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <DeliveryBadge location={vendor.deliveryLocation} />
              <MaterialsSummary materials={vendor.rawMaterials} />
            </div>
            <MaterialTagsGrid materials={vendor.rawMaterials} />
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <VendorActions vendor={vendor} onEdit={onEdit} onFinance={onFinance} layout="stacked" />
          </div>
        </li>
      ))}
    </ul>
  );
}
