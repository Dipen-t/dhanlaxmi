"use client";

import { useEffect, useRef, useState } from "react";
import { Designer } from "@pdfme/ui";
import { text, image, barcodes } from "@pdfme/schemas";

const BLANK_TEMPLATE = {
  basePdf: { width: 210, height: 297, padding: [10, 10, 10, 10] },
  schemas: [{}],
};

type PdfmeDesignerProps = {
  initialTemplateJson?: string;
  onSave: (templateJson: string) => void;
  onCancel: () => void;
};

export function PdfmeDesigner({
  initialTemplateJson,
  onSave,
  onCancel,
}: PdfmeDesignerProps) {
  const designerRef = useRef<HTMLDivElement | null>(null);
  const designerInstance = useRef<Designer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let template = BLANK_TEMPLATE;
    if (initialTemplateJson) {
      try {
        template = JSON.parse(initialTemplateJson);
      } catch (e) {
        console.error("Failed to parse initial template:", e);
      }
    }

    if (designerRef.current) {
      try {
        designerInstance.current = new Designer({
          domContainer: designerRef.current,
          template,
          plugins: {
            text,
            image,
            qrcode: barcodes.qrcode,
            barcode: barcodes.code128,
          },
        });
      } catch (e: any) {
        setError(e.message || "Failed to load designer");
      }

      return () => {
        if (designerInstance.current) {
          designerInstance.current.destroy();
        }
      };
    }
  }, [initialTemplateJson]);

  const handleSave = () => {
    if (designerInstance.current) {
      const updatedTemplate = designerInstance.current.getTemplate();
      onSave(JSON.stringify(updatedTemplate));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] border border-border rounded-xl bg-background overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface/50">
        <div>
          <h3 className="font-semibold text-foreground">Template Designer</h3>
          <p className="text-xs text-muted">Map fields exactly to match data (e.g., menuName, date)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Template
          </button>
        </div>
      </div>
      
      {error ? (
        <div className="p-8 text-center text-error">{error}</div>
      ) : (
        <div ref={designerRef} className="flex-1 w-full bg-surface/30" />
      )}
    </div>
  );
}
