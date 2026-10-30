"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  // Sit above the form action bar and stay clear of Cancel (left-padded footer).
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="fixed z-50 flex size-12 items-center justify-center rounded-full border border-border/50 bg-background/90 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:size-14"
      style={{
        bottom: "max(5.25rem, calc(env(safe-area-inset-bottom) + 4.5rem))",
        left: "max(1rem, env(safe-area-inset-left))",
      }}
    >
      <ChevronLeft className="size-6 md:size-7" strokeWidth={2} aria-hidden />
    </Link>
  );
}
