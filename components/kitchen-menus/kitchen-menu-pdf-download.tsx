"use client";

import { FileDown } from "lucide-react";
import { useEffect, useState } from "react";

import { sanitizeFilename } from "@/lib/menus/sanitize-filename";

type KitchenMenuPdfDownloadProps = {
  menuId: number;
  menuName: string;
  variant?: "icon" | "button";
  className?: string;
  buttonClassName?: string;
};

function isIpadOrIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports as MacIntel with touch.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function KitchenMenuPdfDownload({
  menuId,
  menuName,
  variant = "icon",
  className = "",
  buttonClassName,
}: KitchenMenuPdfDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferShare, setPreferShare] = useState(false);

  useEffect(() => {
    setPreferShare(isIpadOrIos());
  }, []);

  async function handleDownload() {
    setIsLoading(true);
    setError(null);

    const suffix = "-kitchen";
    const filename = `${sanitizeFilename(menuName)}${suffix}.pdf`;
    // Open synchronously so iPad Safari keeps the user gesture after fetch.
    const previewWindow =
      preferShare || isIpadOrIos() ? window.open("about:blank", "_blank") : null;

    try {
      const endpoint = "pdf";
      const response = await fetch(`/api/kitchen-menus/${menuId}/${endpoint}`);

      if (!response.ok) {
        previewWindow?.close();
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          payload?.error ?? `PDF request failed (${response.status}).`,
        );
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        previewWindow?.close();
        throw new Error("PDF file was empty.");
      }

      const file = new File([blob], filename, { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      // iPad Safari: share sheet is the reliable “save/upload” path.
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          previewWindow?.close();
          await navigator.share({
            files: [file],
            title: menuName,
          });
          URL.revokeObjectURL(url);
          return;
        } catch (shareError) {
          if (
            shareError instanceof Error &&
            shareError.name === "AbortError"
          ) {
            URL.revokeObjectURL(url);
            return;
          }
          // Fall through to open/download.
        }
      }

      if (preferShare || isIpadOrIos()) {
        // Safari often ignores <a download>; open PDF so user can share/save.
        if (previewWindow && !previewWindow.closed) {
          previewWindow.location.href = url;
        } else {
          const opened = window.open(url, "_blank");
          if (!opened) {
            window.location.assign(url);
          }
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      previewWindow?.close();
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      previewWindow?.close();
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
    buttonClassName ??
    "inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary/30 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className={className}>
      {variant === "button" ? (
        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading}
          className={`${baseClass} gap-2 px-4 text-sm font-semibold text-foreground`}
        >
          <FileDown className="size-4" strokeWidth={1.75} aria-hidden />
          {isLoading
            ? "Preparing…"
            : preferShare
              ? "Share / save Kitchen PDF"
              : "Download Kitchen PDF"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDownload}
          disabled={isLoading}
          aria-label={
            preferShare
              ? `Share or save ${menuName} as Kitchen PDF`
              : `Download ${menuName} as Kitchen PDF`
          }
          className={`${baseClass} min-w-11 px-2`}
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
