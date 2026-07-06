"use client";

import { usePathname } from "next/navigation";

import { BackButton } from "@/components/back-button";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showFloatingActions = pathname !== "/";

  return (
    <div
      className={`relative flex min-h-full flex-1 flex-col${showFloatingActions ? " pb-20" : ""}`}
    >
      {children}
      <BackButton />
    </div>
  );
}
