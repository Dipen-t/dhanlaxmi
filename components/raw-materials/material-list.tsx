"use client";

import { useMemo } from "react";

import type { MaterialWithVendor } from "@/app/raw-materials/actions";
import { AlphabetScrubber, letterFor } from "@/components/alphabet-scrubber";

import { MaterialActions, VendorBadge } from "./material-actions";

type MaterialListProps = {
  materials: MaterialWithVendor[];
  onEdit: (material: MaterialWithVendor) => void;
};

export function MaterialList({ materials, onEdit }: MaterialListProps) {
  const groups = useMemo(() => {
    const map = new Map<string, MaterialWithVendor[]>();

    for (const material of materials) {
      const key = letterFor(material.name);
      const bucket = map.get(key);
      if (bucket) bucket.push(material);
      else map.set(key, [material]);
    }

    return [...map.entries()].sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [materials]);

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
            id={`materials-section-${letter}`}
            aria-labelledby={`materials-heading-${letter}`}
            className="scroll-mt-28 sm:scroll-mt-32"
          >
            <div className="sticky top-19 z-10 -mx-1 mb-2 bg-background/95 px-1 py-1.5 backdrop-blur-sm sm:top-20">
              <h2
                id={`materials-heading-${letter}`}
                className="inline-flex min-w-9 items-center justify-center rounded-md bg-surface px-2.5 py-1 text-sm font-semibold text-foreground"
              >
                {letter}
              </h2>
            </div>

            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {items.map((material) => (
                <li key={material.id}>
                  <div className="flex items-stretch gap-2 p-2 sm:gap-3 sm:p-2.5">
                    <button
                      type="button"
                      onClick={() => onEdit(material)}
                      className="flex min-h-14 min-w-0 flex-1 touch-manipulation items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface active:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-foreground text-pretty md:text-lg">
                          {material.name}
                        </p>
                        <div className="mt-1.5">
                          <VendorBadge material={material} />
                        </div>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center pr-1">
                      <MaterialActions material={material} onEdit={onEdit} />
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
        sectionIdPrefix="materials"
      />
    </div>
  );
}
