"use client";

import { FileDown, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";

import { sanitizeFilename } from "@/lib/menus/sanitize-filename";
import { getPdfTemplates } from "@/app/settings/pdf-templates/actions";

type MenuPdfDownloadProps = {
  menuId: number;
  menuName: string;
  variant?: "icon" | "button";
  className?: string;
  buttonClassName?: string;
};

type TemplateRecord = {
  id: number;
  name: string;
};

function isIpadOrIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function MenuPdfDownload({
  menuId,
  menuName,
  variant = "icon",
  className = "",
  buttonClassName,
}: MenuPdfDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferShare, setPreferShare] = useState(false);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setPreferShare(isIpadOrIos());
    getPdfTemplates().then(data => {
      if (Array.isArray(data)) {
        setTemplates(data.map(t => ({ id: t.id, name: t.name })));
      }
    });
  }, []);

  const openTemplateSelection = () => {
    if (templates.length > 0) {
      dialogRef.current?.showModal();
    } else {
      handleDownload(); // Fallback if no templates
    }
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  async function handleDownload(templateId?: number) {
    closeDialog();
    setIsLoading(true);
    setError(null);

    const suffix = "";
    const filename = `${sanitizeFilename(menuName)}${suffix}.pdf`;
    const previewWindow =
      preferShare || isIpadOrIos() ? window.open("about:blank", "_blank") : null;

    try {
      const endpoint = "pdf";
      const urlWithQuery = templateId 
        ? `/api/menus/${menuId}/${endpoint}?templateId=${templateId}`
        : `/api/menus/${menuId}/${endpoint}`;

      const response = await fetch(urlWithQuery);

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
          onClick={openTemplateSelection}
          disabled={isLoading}
          className={`${baseClass} gap-2 px-4 text-sm font-semibold text-foreground`}
        >
          <FileDown className="size-4" strokeWidth={1.75} aria-hidden />
          {isLoading
            ? "Preparing…"
            : preferShare
              ? "Share / save PDF"
              : "Download PDF"}
        </button>
      ) : (
        <button
          type="button"
          onClick={openTemplateSelection}
          disabled={isLoading}
          aria-label={
            preferShare
              ? `Share or save ${menuName} as PDF`
              : `Download ${menuName} as PDF`
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

      <dialog ref={dialogRef} className="app-dialog" onClose={closeDialog}>
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Select PDF Template</h2>
            <button onClick={closeDialog} className="rounded-md p-1 hover:bg-surface transition-colors">
              <X className="size-5 text-muted" />
            </button>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleDownload(template.id)}
                className="w-full px-4 py-3 text-left rounded-lg border border-border bg-background hover:bg-surface hover:border-primary/50 transition-colors flex justify-between items-center group"
              >
                <span className="font-medium text-foreground">{template.name}</span>
                <FileDown className="size-4 text-muted group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center px-5 py-4 border-t border-border/50 bg-surface/30">
             <span className="text-xs text-muted">Or download without a template</span>
             <button
                onClick={() => handleDownload()}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-background transition-colors"
             >
                Use Standard (Legacy)
             </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
