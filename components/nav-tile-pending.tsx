"use client";

import { ChevronRight, Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";

/** Must live under a Link — chevron at rest, spinner while navigating. */
export function NavTilePending() {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <Loader2
        aria-hidden
        className="size-5 shrink-0 animate-spin text-primary md:size-6"
        strokeWidth={1.75}
      />
    );
  }

  return (
    <ChevronRight
      aria-hidden
      className="size-5 shrink-0 text-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-primary group-active:translate-x-0.5 group-active:text-primary md:size-6"
      strokeWidth={1.75}
    />
  );
}
