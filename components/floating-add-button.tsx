"use client";

import { Plus } from "lucide-react";

type FloatingAddButtonProps = {
  onClick: () => void;
  label: string;
};

export function FloatingAddButton({ onClick, label }: FloatingAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed z-50 flex size-14 md:size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/90 text-primary-foreground shadow-none backdrop-blur-md transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        right: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <Plus className="size-7 md:size-8" strokeWidth={2} aria-hidden />
    </button>
  );
}
