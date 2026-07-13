import Link from "next/link";

import { NavTilePending } from "@/components/nav-tile-pending";
import type { HomeTile } from "@/lib/nav-config";

type NavTileProps = HomeTile;

export function NavTile({ href, title, description, icon: Icon }: NavTileProps) {
  return (
    <Link
      href={href}
      prefetch
      className="group flex min-h-16 touch-manipulation items-center gap-4 rounded-xl border border-border bg-background px-4 py-4 transition-[color,background-color,border-color,transform] duration-150 ease-out hover:border-primary/30 hover:bg-surface active:scale-[0.99] active:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-5 sm:py-5 md:min-h-[5.5rem] md:gap-5 md:px-6 md:py-6"
    >
      <div
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition-colors duration-150 ease-out group-hover:bg-primary group-hover:text-primary-foreground group-active:bg-primary group-active:text-primary-foreground md:size-14 md:rounded-xl"
      >
        <Icon className="size-6 md:size-7" strokeWidth={1.75} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground text-balance md:text-xl">
          {title}
        </p>
        <p className="mt-0.5 text-sm text-muted md:mt-1 md:text-base">
          {description}
        </p>
      </div>

      <NavTilePending />
    </Link>
  );
}
