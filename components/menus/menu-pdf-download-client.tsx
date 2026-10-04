"use client";

import { Check, FileDown, X } from "lucide-react";
import { useEffect, useState, useRef, useId } from "react";
import Image from "next/image";
import { menuPdfThemes } from "@/lib/menus/pdf-themes";

import { sanitizeFilename } from "@/lib/menus/sanitize-filename";

type MenuPdfDownloadProps = {
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

export function MenuPdfDownload({
  menuId,
  menuName,
  variant = "button",
  className = "",
  buttonClassName,
}: MenuPdfDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferShare, setPreferShare] = useState(false);
  const uid = useId();
  const [fontFamily, setFontFamily] = useState("SourceSans");
  const [fontSize, setFontSize] = useState("10pt");
  const [theme, setTheme] = useState("standard");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPreferShare(isIpadOrIos()));
    return () => cancelAnimationFrame(frame);
  }, []);

  const openTemplateSelection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dialogRef.current?.showModal();

  };

  const closeDialog = () => {
    dialogRef.current?.close();

  };

  async function handleDownload() {
    closeDialog();
    setIsLoading(true);
    setError(null);

    const filename = `${sanitizeFilename(menuName)}.pdf`;
    const previewWindow =
      preferShare || isIpadOrIos() ? window.open("about:blank", "_blank") : null;

    try {
      const urlWithQuery = `/api/menus/${menuId}/pdf?theme=${theme}&fontFamily=${fontFamily}&fontSize=${fontSize}`;
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

      <dialog ref={dialogRef} aria-labelledby={`${uid}-title`} className="m-auto w-[95vw] max-w-5xl rounded-xl border border-border bg-background p-0 shadow-xl backdrop:bg-slate-900/50">
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div><h2 id={`${uid}-title`} className="text-lg font-semibold">Choose a menu theme</h2><p className="mt-1 text-sm text-muted">Sample designs shown below. Your menu content is added when you download.</p></div>
            <button type="button" aria-label="Close theme selection" onClick={closeDialog} className="rounded-lg p-2 hover:bg-surface"><X className="size-5" /></button>
          </div>
          <div className="overflow-y-auto p-5">
            <fieldset><legend className="sr-only">Menu theme</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {menuPdfThemes.map(item => <label key={item.id} className="relative cursor-pointer">
                  <input type="radio" name={`${uid}-theme`} value={item.id} checked={theme === item.id} onChange={() => setTheme(item.id)} className="peer sr-only" />
                  <div className="h-full overflow-hidden rounded-xl border-2 border-border transition-colors peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 hover:border-primary/50">
                    <div className="flex h-64 items-center justify-center gap-2 bg-surface p-3">
                      <Image src={item.coverPreview} alt={`${item.name} ${item.menuPreview ? "cover" : "menu page"}`} width={200} height={400} className="h-full w-auto min-w-0 object-contain shadow-sm" />
                      {item.menuPreview && <Image src={item.menuPreview} alt={`${item.name} menu page`} width={200} height={400} className="h-full w-auto min-w-0 object-contain shadow-sm" />}
                    </div>
                    <div className="p-3"><div className="flex items-center justify-between"><span className="font-semibold">{item.name}</span>{theme === item.id && <Check className="size-5 text-primary" aria-hidden />}</div><p className="mt-1 text-xs text-muted">{item.description}</p></div>
                  </div>
                </label>)}
              </div>
            </fieldset>
            {theme === "standard" && <div className="mt-5 flex flex-wrap gap-4 rounded-lg border border-border p-4">
              <label className="space-y-1 text-sm font-medium" htmlFor={`${uid}-font`}>Typography<select id={`${uid}-font`} value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="block rounded-lg border border-border bg-background px-3 py-2"><option value="SourceSans">Source Sans</option><option value="Inter">Inter</option><option value="Playball">Playball</option><option value="Cormorant">Cormorant</option></select></label>
              <label className="space-y-1 text-sm font-medium" htmlFor={`${uid}-size`}>Font size<select id={`${uid}-size`} value={fontSize} onChange={e => setFontSize(e.target.value)} className="block rounded-lg border border-border bg-background px-3 py-2"><option value="10pt">Small (10pt)</option><option value="12pt">Medium (12pt)</option><option value="14pt">Large (14pt)</option></select></label>
            </div>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border px-5 py-4">
            <span className="mr-auto text-sm text-muted">{menuPdfThemes.find(item => item.id === theme)?.name}</span>
            <button type="button" onClick={closeDialog} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface">Cancel</button>
            <button type="button" onClick={handleDownload} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><FileDown className="size-4" />Download PDF</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
