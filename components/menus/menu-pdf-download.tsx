"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const MenuPdfDownloadClient = dynamic(
  () => import("./menu-pdf-download-client").then((mod) => mod.MenuPdfDownload),
  { ssr: false, loading: () => <div className="min-w-11 min-h-11 inline-flex animate-pulse bg-muted rounded-lg" /> }
);

export function MenuPdfDownload(
  props: ComponentProps<typeof MenuPdfDownloadClient>
) {
  return <MenuPdfDownloadClient {...props} />;
}
