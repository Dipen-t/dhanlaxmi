import type { VendorWithMaterials } from "@/app/vendors/actions";

import {
  DeliveryBadge,
  MaterialsSummary,
  VendorActions,
} from "./vendor-actions";
import { MaterialTagsGrid } from "./material-tags-grid";

type VendorListProps = {
  vendors: VendorWithMaterials[];
  onEdit: (vendor: VendorWithMaterials) => void;
};

export function VendorList({ vendors, onEdit }: VendorListProps) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {vendors.map((vendor) => (
        <li key={vendor.id} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground [text-wrap:pretty]">
                {vendor.name}
              </p>
              <p className="mt-0.5 text-sm text-muted">{vendor.phone}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DeliveryBadge location={vendor.deliveryLocation} />
              <MaterialsSummary materials={vendor.rawMaterials} />
            </div>
            <VendorActions vendor={vendor} onEdit={onEdit} />
          </div>
          <MaterialTagsGrid materials={vendor.rawMaterials} />
        </li>
      ))}
    </ul>
  );
}
