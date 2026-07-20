"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="fixed z-50 flex size-14 md:size-16 items-center justify-center rounded-full border border-border/50 bg-background/30 text-foreground backdrop-blur-md transition-colors hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        left: "max(1rem, env(safe-area-inset-left))",
      }}
    >
      <ChevronLeft className="size-7 md:size-8" strokeWidth={2} aria-hidden />
    </Link>
  );
}
