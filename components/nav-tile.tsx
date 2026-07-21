import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import { NavTilePending } from "@/components/nav-tile-pending";
import type { HomeTile } from "@/lib/nav-config";

type NavTileProps = HomeTile & {
  variant?: "featured" | "compact";
};

export function NavTile({ href, title, description, icon: Icon, variant = "featured" }: NavTileProps) {
  const isClientMenu = href === "/menus";
  const isMenuCard = href === "/menus" || href === "/kitchen-menus";
  const buttonText = ["/raw-materials", "/vendors"].includes(href) ? "Manage" : "View";

  const themeClasses = isClientMenu 
    ? {
        iconBg: "bg-[#FDF6E3] text-[#B8860B]",
        pillBg: "bg-[#FDF6E3] text-[#B8860B]",
      }
    : {
        iconBg: "bg-[#edf6f0] text-primary",
        pillBg: "bg-[#edf6f0] text-primary",
      };

  if (variant === "compact") {
    return (
      <Link
        href={href}
        prefetch
        className="group relative flex items-center gap-3 sm:gap-4 rounded-xl bg-white p-3 sm:p-4 shadow-sm transition-all duration-200 hover:shadow-md border border-transparent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div
          aria-hidden
          className={`flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-lg ${themeClasses.iconBg} transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm sm:text-base truncate">{title}</p>
          <p className="text-xs text-muted truncate">{description}</p>
        </div>
        <NavTilePending />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      prefetch
      className="group relative flex min-h-[7rem] items-center gap-4 sm:gap-6 rounded-[1.25rem] bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md border border-transparent hover:border-border overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Background Media */}
      {isMenuCard && (
        <div className="absolute bottom-0 right-0 w-40 h-40 sm:w-48 sm:h-48 z-0 pointer-events-none opacity-40 mix-blend-multiply transition-transform duration-300 group-hover:scale-105">
          <Image 
            src="/bottom-right.jpeg" 
            alt="" 
            fill 
            className="object-cover" 
            style={{ objectPosition: 'bottom right' }}
          />
        </div>
      )}

      {/* Icon Block */}
      <div
        aria-hidden
        className={`relative z-10 flex size-16 sm:size-20 shrink-0 items-center justify-center rounded-2xl ${themeClasses.iconBg} transition-transform duration-300 group-hover:scale-105`}
      >
        <Icon className="size-8 sm:size-10" strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-serif text-[1.1rem] sm:text-lg font-bold text-foreground mb-1 truncate">
          {title}
        </h3>
        <p className="text-[11px] sm:text-xs text-muted mb-3 sm:mb-4 truncate">
          {description}
        </p>
        <div className="flex items-center">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold ${themeClasses.pillBg}`}>
            {buttonText} <ArrowRight className="size-3 sm:size-3.5" />
          </span>
        </div>
      </div>

      <div className="relative z-10 flex shrink-0 items-center justify-center">
        <NavTilePending />
      </div>
    </Link>
  );
}
