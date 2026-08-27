"use client";

import { Download, FileDown, Loader2, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import { sanitizeFilename } from "@/lib/menus/sanitize-filename";

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
  variant = "button",
  className = "",
  buttonClassName,
}: MenuPdfDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferShare, setPreferShare] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState("standard");
  const [fontFamily, setFontFamily] = useState("SourceSans");
  const [fontSize, setFontSize] = useState("10pt");
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setPreferShare(isIpadOrIos());
  }, []);

  // Fetch the PDF blob for the live preview
  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      if (!isOpen) return;

      setIsPreviewLoading(true);
      try {
        const urlWithQuery = `/api/menus/${menuId}/pdf?theme=${theme}&fontFamily=${fontFamily}&fontSize=${fontSize}&inline=true&preview=true`;
        const response = await fetch(urlWithQuery);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          // We fetched it as octet-stream to bypass download managers, now we re-cast it to application/pdf for the embed
          const pdfBlob = new Blob([buffer], { type: "application/pdf" });
          if (isMounted) {
            const url = URL.createObjectURL(pdfBlob);
            setPreviewBlobUrl(url);
          }
        }
      } catch (e) {
        console.error("Preview fetch failed", e);
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [menuId, theme, fontFamily, fontSize, isOpen]);

  const openTemplateSelection = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dialogRef.current?.showModal();
    setIsOpen(true);
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    setIsOpen(false);
    setPreviewBlobUrl(null);
    setPageNumber(1);
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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
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

      <dialog ref={dialogRef} className="w-[95vw] max-w-5xl rounded-xl p-0 border border-border bg-background shadow-xl backdrop:bg-slate-900/50 m-auto" onClose={closeDialog}>
        <div className="flex flex-col h-[85vh] max-h-[800px] w-full">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-background shrink-0">
            <div>
              <h2 className="text-lg font-bold text-foreground">Download PDF</h2>
              <p className="text-sm text-muted">Customize the look and feel of your menu before downloading.</p>
            </div>
            <button onClick={closeDialog} className="rounded-md p-2 hover:bg-surface transition-colors">
              <X className="size-5 text-muted" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Left side: Configuration */}
            <div className="w-full md:w-[320px] shrink-0 border-b md:border-b-0 md:border-r border-border/50 bg-surface/30 p-5 flex flex-col gap-5 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="theme" className="text-sm font-semibold text-foreground">Theme</label>
                  <select
                    id="theme"
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="standard">Standard (Teal)</option>
                    <option value="wedding">Wedding (Classic/Blush)</option>
                    <option value="party">Party (Vibrant/Modern)</option>
                    <option value="corporate">Corporate (Minimal/Slate)</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="fontFamily" className="text-sm font-semibold text-foreground">Typography</label>
                  <select
                    id="fontFamily"
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                  >
                    <option value="SourceSans">Source Sans (Clean Sans)</option>
                    <option value="Inter">Inter (Modern Sans)</option>
                    <option value="Playball">Playball (Elegant Script)</option>
                    <option value="Cormorant">Cormorant (Classic Serif)</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label htmlFor="fontSize" className="text-sm font-semibold text-foreground">Font Size</label>
                  <select
                    id="fontSize"
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary w-full"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                  >
                    <option value="10pt">Small (10pt)</option>
                    <option value="12pt">Medium (12pt)</option>
                    <option value="14pt">Large (14pt)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right side: Live Preview */}
            <div className="flex-1 bg-muted/20 p-4 sm:p-6 overflow-hidden flex flex-col items-center justify-center">
              <div className="w-full h-full max-w-[800px] overflow-auto relative flex flex-col items-center">
                {isPreviewLoading && !previewBlobUrl && (
                  <div className="flex flex-col items-center justify-center text-muted h-full">
                    <Loader2 className="h-8 w-8 mb-4 text-primary animate-spin" />
                    <p className="text-sm font-medium">Generating preview...</p>
                  </div>
                )}
                {previewBlobUrl && (
                  <div className={`transition-opacity duration-300 shadow-sm border border-border bg-white ${isPreviewLoading ? 'opacity-50' : 'opacity-100'}`}>
                    <Document
                      file={previewBlobUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="h-[600px] w-[450px] flex items-center justify-center text-muted">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      }
                      error={
                        <div className="h-[600px] w-[450px] flex flex-col items-center justify-center text-error p-6 text-center bg-error-soft/30">
                          <p className="font-semibold mb-2">Could not load preview</p>
                          <p className="text-sm opacity-80">The PDF may be corrupted or blocked by the browser.</p>
                        </div>
                      }
                    >
                      <Page 
                        pageNumber={pageNumber} 
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={Math.min(typeof window !== 'undefined' ? (window.innerWidth > 768 ? window.innerWidth - 420 : window.innerWidth - 80) : 800, 800)}
                        className="shadow-xl"
                      />
                    </Document>
                    {numPages && numPages > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/70 text-white px-4 py-2 rounded-full shadow-lg z-10 backdrop-blur-md">
                        <button
                          disabled={pageNumber <= 1}
                          onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                          className="disabled:opacity-50 hover:bg-white/20 p-1 rounded transition-colors"
                        >
                          &larr; Prev
                        </button>
                        <span className="text-sm font-medium text-white/90">
                          Page {pageNumber} of {numPages}
                        </span>
                        <button
                          disabled={pageNumber >= numPages}
                          onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                          className="disabled:opacity-50 hover:bg-white/20 p-1 rounded transition-colors"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-border/50 bg-background shrink-0">
             <button
                onClick={closeDialog}
                className="px-4 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-surface transition-colors"
             >
                Cancel
             </button>
             <button
                onClick={() => handleDownload()}
                disabled={isLoading}
                className="px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
             >
                <FileDown className="size-4" />
                {isLoading ? "Downloading..." : "Download Final PDF"}
             </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
