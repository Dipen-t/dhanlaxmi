"use client";

import { usePathname } from "next/navigation";

import { BackButton } from "@/components/back-button";
import { ClickSoundProvider } from "@/components/click-sound-provider";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showFloatingActions = pathname !== "/";

  return (
    <div
      className={`relative mx-auto flex w-full max-w-6xl min-h-full flex-1 flex-col${showFloatingActions ? " pb-24" : ""}`}
    >
      <ClickSoundProvider />
      {children}
      <BackButton />
    </div>
  );
}
