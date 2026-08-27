"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Plus, Pencil, Trash2, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { savePdfTemplate, deletePdfTemplate } from "./actions";

const PdfmeDesigner = dynamic(
  () => import("./pdfme-designer").then((mod) => mod.PdfmeDesigner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 text-muted">
        Loading PDF Designer...
      </div>
    ),
  }
);

type TemplateRecord = {
  id: number;
  name: string;
  type: string;
  templateJson: string;
  createdAt: Date;
};

export function PdfTemplatesClient({
  initialTemplates,
}: {
  initialTemplates: TemplateRecord[];
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<TemplateRecord> | null>(null);

  const handleCreate = () => {
    setCurrentTemplate({ name: "New Menu Template", type: "menu" });
    setIsEditing(true);
  };

  const handleEdit = (template: TemplateRecord) => {
    setCurrentTemplate(template);
    setIsEditing(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    
    startTransition(async () => {
      const res = await deletePdfTemplate(id);
      if (res.error) toast.error(res.error);
      else toast.success("Template deleted");
    });
  };

  const handleSaveLayout = async (templateJson: string) => {
    if (!currentTemplate) return;
    
    const formData = new FormData();
    if (currentTemplate.id) formData.append("id", String(currentTemplate.id));
    formData.append("name", currentTemplate.name || "Untitled");
    formData.append("type", currentTemplate.type || "menu");
    formData.append("templateJson", templateJson);

    startTransition(async () => {
      const res = await savePdfTemplate(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Template saved");
        setIsEditing(false);
        setCurrentTemplate(null);
      }
    });
  };

  if (isEditing && currentTemplate) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={currentTemplate.name || ""}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
            className="text-xl font-bold bg-transparent border-b border-border/50 focus:border-primary outline-none px-1 py-0.5"
            placeholder="Template Name"
          />
          <select
            value={currentTemplate.type || "menu"}
            onChange={(e) => setCurrentTemplate({ ...currentTemplate, type: e.target.value })}
            className="text-sm bg-surface border border-border rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="menu">Menu</option>
            <option value="kitchen-menu">Kitchen Menu</option>
            <option value="report">Report</option>
          </select>
        </div>
        <PdfmeDesigner
          initialTemplateJson={currentTemplate.templateJson}
          onSave={handleSaveLayout}
          onCancel={() => {
            setIsEditing(false);
            setCurrentTemplate(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Your Templates</h2>
          <p className="text-sm text-muted">Manage PDF layouts for menus and reports</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Create Template
        </button>
      </div>

      {initialTemplates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center flex flex-col items-center">
          <LayoutTemplate className="size-10 text-muted/50 mb-3" />
          <p className="text-base font-medium text-foreground">No templates yet</p>
          <p className="mt-1 text-sm text-muted">Create a visual layout for your PDFs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialTemplates.map((template) => (
            <div key={template.id} className="flex flex-col p-4 rounded-xl border border-border bg-background shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  <span className="inline-block mt-1 text-xs font-medium bg-surface text-muted px-2 py-0.5 rounded-full capitalize">
                    {template.type}
                  </span>
                </div>
              </div>
              <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30"
                >
                  <Pencil className="size-3.5" />
                  Edit Layout
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-error/20 bg-error-soft px-3 py-1.5 text-xs font-medium text-error hover:bg-error-soft/80 disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
