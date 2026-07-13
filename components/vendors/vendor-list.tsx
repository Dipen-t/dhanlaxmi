"use client";

import { useMemo } from "react";

import type { VendorWithMaterials } from "@/app/vendors/actions";
import { AlphabetScrubber, letterFor } from "@/components/alphabet-scrubber";

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
  const groups = useMemo(() => {
    const map = new Map<string, VendorWithMaterials[]>();

    for (const vendor of vendors) {
      const key = letterFor(vendor.name);
      const bucket = map.get(key);
      if (bucket) bucket.push(vendor);
      else map.set(key, [vendor]);
    }

    return [...map.entries()].sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [vendors]);

  const availableLetters = useMemo(
    () => new Set(groups.map(([letter]) => letter)),
    [groups],
  );

  return (
    <div className="relative pr-9 sm:pr-10">
      <div className="space-y-5">
        {groups.map(([letter, items]) => (
          <section
            key={letter}
            id={`vendors-section-${letter}`}
            aria-labelledby={`vendors-heading-${letter}`}
            className="scroll-mt-28 sm:scroll-mt-32"
          >
            <div className="sticky top-19 z-10 -mx-1 mb-2 bg-background/95 px-1 py-1.5 backdrop-blur-sm sm:top-20">
              <h2
                id={`vendors-heading-${letter}`}
                className="inline-flex min-w-9 items-center justify-center rounded-md bg-surface px-2.5 py-1 text-sm font-semibold text-foreground"
              >
                {letter}
              </h2>
            </div>

            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {items.map((vendor) => (
                <li key={vendor.id}>
                  <div className="flex items-stretch gap-2 p-2 sm:gap-3 sm:p-2.5">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onEdit(vendor)}
                        className="flex min-h-14 w-full touch-manipulation flex-col items-stretch gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface active:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                      >
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-foreground text-pretty md:text-lg">
                            {vendor.name}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">
                            {vendor.phone}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <DeliveryBadge location={vendor.deliveryLocation} />
                          <MaterialsSummary materials={vendor.rawMaterials} />
                        </div>
                      </button>
                      <div className="px-2 pb-2 sm:px-3">
                        <MaterialTagsGrid materials={vendor.rawMaterials} />
                      </div>
                    </div>

                    <div className="flex shrink-0 items-start pt-2 pr-1">
                      <VendorActions vendor={vendor} onEdit={onEdit} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <AlphabetScrubber
        availableLetters={availableLetters}
        sectionIdPrefix="vendors"
      />
    </div>
  );
}
