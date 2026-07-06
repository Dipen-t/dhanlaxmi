"use client";

import { LayoutGrid, List, Plus } from "lucide-react";

export type ViewMode = "grid" | "list";

type MaterialToolbarProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAdd: () => void;
};

export function MaterialToolbar({
  viewMode,
  onViewModeChange,
  onAdd,
}: MaterialToolbarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div
        className="inline-flex rounded-lg border border-border p-1"
        role="group"
        aria-label="View mode"
      >
        <button
          type="button"
          aria-pressed={viewMode === "grid"}
          onClick={() => onViewModeChange("grid")}
          className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            viewMode === "grid"
              ? "bg-primary-soft text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          <LayoutGrid className="size-4" strokeWidth={1.75} aria-hidden />
          <span className="sr-only">Grid view</span>
        </button>
        <button
          type="button"
          aria-pressed={viewMode === "list"}
          onClick={() => onViewModeChange("list")}
          className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            viewMode === "list"
              ? "bg-primary-soft text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          <List className="size-4" strokeWidth={1.75} aria-hidden />
          <span className="sr-only">List view</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden />
        Add material
      </button>
    </div>
  );
}
