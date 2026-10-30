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
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

async function blobFromResponse(response: Response) {
  const buffer = await response.arrayBuffer();
  return new Blob([buffer], { type: "application/pdf" });
}

function triggerAnchorDownload(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
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
    const frame = requestAnimationFrame(() => setPreferShare(isIpadOrIos()));
    return () => cancelAnimationFrame(frame);
  }, []);

  async function handleDownload() {
    setIsLoading(true);
    setError(null);

    const filename = `${sanitizeFilename(menuName)}-kitchen.pdf`;
    const previewWindow =
      preferShare || isIpadOrIos() ? window.open("about:blank", "_blank") : null;

    try {
      const response = await fetch(`/api/kitchen-menus/${menuId}/pdf`, {
        cache: "no-store",
      });

      if (!response.ok) {
        previewWindow?.close();
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          details?: string;
        } | null;
        throw new Error(
          payload?.details
            ? `${payload.error ?? "Could not generate PDF."} ${payload.details}`
            : payload?.error ?? `PDF request failed (${response.status}).`,
        );
      }

      const blob = await blobFromResponse(response);

      if (blob.size === 0) {
        previewWindow?.close();
        throw new Error("PDF file was empty.");
      }

      const file = new File([blob], filename, { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

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
        }
      }

      if (preferShare || isIpadOrIos()) {
        if (previewWindow && !previewWindow.closed) {
          previewWindow.location.href = url;
        } else {
          const opened = window.open(url, "_blank");
          if (!opened) {
            triggerAnchorDownload(url, filename);
          }
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      previewWindow?.close();
      triggerAnchorDownload(url, filename);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
        <p role="alert" className="mt-1 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
