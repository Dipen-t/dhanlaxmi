"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Edit, X } from "lucide-react";
import { savePdfTemplate, deletePdfTemplate } from "./actions";

export default function PdfTemplatesClient({
  initialTemplates,
}: {
  initialTemplates: any[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const defaultForm = {
    name: "",
    themeType: "standard",
    fontFamily: "SourceSans",
    fontSize: "10pt",
  };

  const [formData, setFormData] = useState(defaultForm);

  const openDialog = (template: any = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        themeType: template.themeType,
        fontFamily: template.fontFamily,
        fontSize: template.fontSize,
      });
    } else {
      setEditingTemplate(null);
      setFormData(defaultForm);
    }
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    if (editingTemplate) {
      data.append("id", editingTemplate.id.toString());
    }
    data.append("name", formData.name);
    data.append("themeType", formData.themeType);
    data.append("fontFamily", formData.fontFamily);
    data.append("fontSize", formData.fontSize);

    const result = await savePdfTemplate(data);
    if (result.success) {
      closeDialog();
      window.location.reload();
    } else {
      alert(result.error);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this template configuration?")) {
      const result = await deletePdfTemplate(id);
      if (result.success) {
        setTemplates(templates.filter((t) => t.id !== id));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-teal-900">
            Menu PDF Templates
          </h1>
          <p className="text-sm text-slate-500">
            Configure beautiful ready-made themes for your menu PDFs.
          </p>
        </div>
        <button
          onClick={() => openDialog()}
          className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Configuration
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">
                {template.name}
              </h3>
              <div className="space-y-1 text-sm text-slate-600">
                <p><span className="font-medium text-slate-700">Theme:</span> <span className="capitalize">{template.themeType}</span></p>
                <p><span className="font-medium text-slate-700">Font:</span> {template.fontFamily}</p>
                <p><span className="font-medium text-slate-700">Size:</span> {template.fontSize === "10pt" ? "Small (10pt)" : template.fontSize === "12pt" ? "Medium (12pt)" : "Large (14pt)"}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => openDialog(template)}
                className="inline-flex items-center justify-center rounded-md border border-teal-200 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
              >
                <Edit className="mr-1 h-4 w-4" /> Edit
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
            <h3 className="text-lg font-medium text-slate-900">No templates configured</h3>
            <p className="mt-1 text-slate-500">Create your first template configuration to get started.</p>
            <button
              onClick={() => openDialog()}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Configuration
            </button>
          </div>
        )}
      </div>

      <dialog ref={dialogRef} className="app-dialog w-full max-w-md rounded-xl p-0 backdrop:bg-slate-900/50" onClose={closeDialog}>
        <form onSubmit={handleSave} className="flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingTemplate ? "Edit Template" : "New Template Configuration"}
            </h2>
            <button type="button" onClick={closeDialog} className="rounded-md p-1 hover:bg-slate-100 text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-900">Configuration Name</label>
              <input
                id="name"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Elegant Wedding"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="theme" className="text-sm font-medium text-slate-900">Base Theme</label>
              <select
                id="theme"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                value={formData.themeType}
                onChange={(e) => setFormData({ ...formData, themeType: e.target.value })}
              >
                <option value="standard">Standard (Teal)</option>
                <option value="wedding">Wedding (Classic/Blush)</option>
                <option value="party">Party (Vibrant/Modern)</option>
                <option value="corporate">Corporate (Minimal/Slate)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="fontFamily" className="text-sm font-medium text-slate-900">Typography</label>
              <select
                id="fontFamily"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                value={formData.fontFamily}
                onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
              >
                <option value="SourceSans">Source Sans (Clean Sans)</option>
                <option value="Inter">Inter (Modern Sans)</option>
                <option value="Playball">Playball (Elegant Script)</option>
                <option value="Cormorant">Cormorant (Classic Serif)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="fontSize" className="text-sm font-medium text-slate-900">Base Font Size</label>
              <select
                id="fontSize"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                value={formData.fontSize}
                onChange={(e) => setFormData({ ...formData, fontSize: e.target.value })}
              >
                <option value="10pt">Small (10pt)</option>
                <option value="12pt">Medium (12pt)</option>
                <option value="14pt">Large (14pt)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
