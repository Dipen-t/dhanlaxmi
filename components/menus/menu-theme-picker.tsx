"use client";

import { useId } from "react";
import { menuPdfThemes } from "@/lib/menus/pdf-themes";

export function MenuThemePicker({ value, onChange, disabled = false }: {
  value: string;
  onChange: (theme: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm font-semibold text-foreground">Choose PDF design</legend>
      <p className="mb-3 text-sm text-muted">The selected design will be used for the PDF sent on WhatsApp.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {menuPdfThemes.map((theme) => (
          <label key={theme.id} className="min-w-0 cursor-pointer">
            <input type="radio" name={`${id}-theme`} value={theme.id} checked={value === theme.id} onChange={() => onChange(theme.id)} className="peer sr-only" />
            <div className="h-full overflow-hidden rounded-xl border-2 border-border peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring hover:border-primary/50">
              {/* Static previews match the existing download theme selector. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={theme.menuPreview ?? theme.coverPreview} alt={`${theme.name} PDF design sample`} width={200} height={300} className="h-40 w-full bg-surface object-contain p-2" />
              <div className="p-2 text-sm font-semibold text-foreground">{theme.name}{value === theme.id ? <span className="sr-only"> (selected)</span> : null}</div>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
