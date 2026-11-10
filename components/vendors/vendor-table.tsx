"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { reorderVendors } from "@/app/vendors/actions";
import type { VendorWithMaterials } from "@/app/vendors/actions";
import { VendorActions } from "./vendor-actions";

type VendorTableProps = {
  vendors: VendorWithMaterials[];
  onEdit: (vendor: VendorWithMaterials) => void;
  onFinance: (vendor: VendorWithMaterials) => void;
};

export function VendorTable({ vendors: initialVendors, onEdit, onFinance }: VendorTableProps) {
  const [vendors, setVendors] = useState(initialVendors);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  function move(index: number, direction: "up" | "down") {
    const next = [...vendors];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setVendors(next);
    const payload = next.map((v, i) => ({ id: v.id, sortOrder: i }));
    startTransition(async () => {
      await reorderVendors(payload);
    });
  }

  if (vendors.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-background shadow-xs">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/75 text-xs font-semibold tracking-wider text-muted uppercase">
            <th className="w-12 px-3 py-3 text-center">Order</th>
            <th className="px-3.5 py-3">Vendor</th>
            <th className="hidden px-3.5 py-3 sm:table-cell">Phone</th>
            <th className="hidden px-3.5 py-3 md:table-cell">Delivery</th>
            <th className="hidden px-3.5 py-3 lg:table-cell">Materials</th>
            <th className="px-3.5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {vendors.map((vendor, index) => (
            <tr
              key={vendor.id}
              className="transition-colors hover:bg-surface/50 active:bg-surface/70"
            >
              <td className="w-12 px-2 py-2.5 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, "up")}
                    disabled={index === 0 || isPending}
                    aria-label={`Move ${vendor.name} up`}
                    title="Move up"
                    className="inline-flex size-7 touch-manipulation items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-20"
                  >
                    <ArrowUp className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, "down")}
                    disabled={index === vendors.length - 1 || isPending}
                    aria-label={`Move ${vendor.name} down`}
                    title="Move down"
                    className="inline-flex size-7 touch-manipulation items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-20"
                  >
                    <ArrowDown className="size-4" strokeWidth={2} />
                  </button>
                </div>
              </td>
              <td className="px-3.5 py-3">
                <button
                  type="button"
                  onClick={() => onEdit(vendor)}
                  className="touch-manipulation text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                >
                  <p className="font-semibold text-foreground">{vendor.name}</p>
                  <p className="mt-0.5 text-xs text-muted sm:hidden">{vendor.phone}</p>
                </button>
              </td>
              <td className="hidden px-3.5 py-3 text-muted sm:table-cell">
                {vendor.phone}
              </td>
              <td className="hidden px-3.5 py-3 md:table-cell">
                <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-muted capitalize">
                  {vendor.deliveryLocation}
                </span>
              </td>
              <td className="hidden px-3.5 py-3 lg:table-cell">
                {vendor.rawMaterials.length === 0 ? (
                  <span className="text-xs text-muted">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {vendor.rawMaterials.slice(0, 3).map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs text-muted"
                      >
                        {m.name}
                      </span>
                    ))}
                    {vendor.rawMaterials.length > 3 ? (
                      <span className="inline-flex items-center rounded-md bg-primary-soft px-1.5 py-0.5 text-xs font-medium text-primary">
                        +{vendor.rawMaterials.length - 3}
                      </span>
                    ) : null}
                  </div>
                )}
              </td>
              <td className="px-3.5 py-3 text-right">
                <div className="flex justify-end">
                  <VendorActions
                    vendor={vendor}
                    onEdit={onEdit}
                    onFinance={onFinance}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
