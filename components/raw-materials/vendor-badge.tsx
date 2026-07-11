import { Truck } from "lucide-react";

type VendorBadgeProps = {
  vendorNames: string[];
};

export function VendorBadge({ vendorNames }: VendorBadgeProps) {
  if (vendorNames.length === 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
        Unassigned
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {vendorNames.map((name, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
          <Truck className="size-3" strokeWidth={2} aria-hidden />
          {name}
        </span>
      ))}
    </div>
  );
}
