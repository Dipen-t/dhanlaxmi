"use client";

import { FileDown } from "lucide-react";
import { useState } from "react";

import { sanitizeFilename } from "@/lib/menus/sanitize-filename";

type MenuPdfDownloadProps = {
  menuId: number;
  menuName: string;
  variant?: "icon" | "button";
  className?: string;
};

export function MenuPdfDownload({
  menuId,
  menuName,
  variant = "icon",
  className = "",
}: MenuPdfDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsLoading(true);
    setError(null);

    const filename = `${sanitizeFilename(menuName)}.pdf`;

    try {
      const response = await fetch(`/api/menus/${menuId}/pdf`);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? `PDF request failed (${response.status}).`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("PDF file was empty.");
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Couldn't generate PDF. Try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const baseClass =
    "inline-flex min-h-10 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className={className}>
      {variant === "button" ? (
        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading}
          className={`${baseClass} gap-2 px-4 text-sm font-medium text-foreground`}
        >
          <FileDown className="size-4" strokeWidth={1.75} aria-hidden />
          {isLoading ? "Generating…" : "Download PDF"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading}
          aria-label={`Download ${menuName} as PDF`}
          className={`${baseClass} min-w-10 px-2`}
        >
          <FileDown className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-primary">
          {error}
        </p>
      ) : null}
    </div>
  );
}
