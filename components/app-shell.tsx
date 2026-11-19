"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { BackButton } from "@/components/back-button";
import { ClickSoundProvider } from "@/components/click-sound-provider";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideChrome = pathname === "/" || pathname === "/expired";
  const showFloatingActions = !hideChrome;

  return (
    <div
      className={`relative flex w-full min-h-full flex-1 flex-col${showFloatingActions ? " pb-24" : ""}`}
    >
      <ClickSoundProvider />
      {children}
      {pathname !== "/expired" ? <Suspense fallback={null}><BackButton /></Suspense> : null}
      {showFloatingActions ? <ScrollToTopButton /> : null}
    </div>
  );
}
