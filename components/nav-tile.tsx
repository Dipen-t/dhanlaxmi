import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { HomeTile } from "@/lib/nav-config";

type NavTileProps = HomeTile;

export function NavTile({ href, title, description, icon: Icon }: NavTileProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-14 items-center gap-4 rounded-xl border border-border bg-background px-4 py-4 transition-colors hover:border-primary/30 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-5 sm:py-5"
    >
      <div
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
      >
        <Icon className="size-6" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground [text-wrap:balance]">
          {title}
        </p>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>

      <ChevronRight
        aria-hidden
        className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        strokeWidth={1.75}
      />
    </Link>
  );
}
