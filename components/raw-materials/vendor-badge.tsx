import { Truck } from "lucide-react";

type VendorBadgeProps = {
  vendorName: string | null;
};

export function VendorBadge({ vendorName }: VendorBadgeProps) {
  if (!vendorName) {
    return (
      <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted">
        Unassigned
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
      <Truck className="size-3" strokeWidth={2} aria-hidden />
      {vendorName}
    </span>
  );
}
