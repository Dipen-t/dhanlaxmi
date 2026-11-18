"use client";

import { useState, useTransition } from "react";
import { removeLocalInstallation, unlockLocalRemoval } from "@/app/settings/removal-actions";

const inputClass = "mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass = "min-h-12 rounded-lg border border-error px-4 py-2 text-sm font-semibold text-error hover:bg-error-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function LocalRemovalPanel({ available, reason }: { available: boolean; reason: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false); setPassword(""); setToken(""); setConfirmation(""); setError("");
  }

  return (
    <section className="mt-10 border-t border-border pt-6" aria-labelledby="local-removal-title">
      <h2 id="local-removal-title" className="text-lg font-semibold text-foreground">Delete local app and data</h2>
      <p className="mt-2 text-sm text-muted">Permanently removes this tablet’s app folder and its local business database, including orders, vendors, payments, expenses and menus. This cannot be undone.</p>
      <p className="mt-2 text-sm text-muted">Vercel, cloud files, WhatsApp messages, and downloads or backups outside the app folder remain. Termux stays installed.</p>
      {!available ? <p className="mt-3 text-sm text-muted">{reason}</p> : null}
      {started ? (
        <div role="status" className="mt-4 space-y-2 text-sm text-foreground">
          <p className="font-semibold">Local removal has started. This app will disconnect.</p>
          <p>Completion is recorded on the device in ~/.local/state/dhanlaxmi-removal/status.json. If removal fails, the app may stop before its files are deleted.</p>
        </div>
      ) : !open ? (
        <button type="button" disabled={!available} onClick={() => setOpen(true)} className={`${buttonClass} mt-4`}>Delete local app and data</button>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={(event) => {
          event.preventDefault();
          if (pending) return;
          setError("");
          startTransition(async () => {
            try {
              if (!token) {
                const result = await unlockLocalRemoval(password);
                setPassword("");
                if (result.error) setError(result.error);
                else if (result.token) setToken(result.token);
              } else {
                const result = await removeLocalInstallation(token, confirmation);
                if (result.error) { setError(result.error); setToken(""); setConfirmation(""); }
                else if (result.started) {
                  setStarted(true); setToken(""); setConfirmation("");
                  try { localStorage.clear(); sessionStorage.clear(); } catch { /* Device storage may be unavailable. */ }
                }
              }
            } catch { setError("Could not contact the app. Check the device before retrying."); }
          });
        }}>
          {!token ? (
            <label className="block text-sm font-medium text-foreground">Deletion password
              <input type="password" autoComplete="off" required maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} className={inputClass} />
            </label>
          ) : (
            <div>
              <p className="mb-3 text-sm font-semibold text-error">Are you sure? The local database and app files will be permanently deleted.</p>
              <label className="block text-sm font-medium text-foreground">Type DELETE EVERYTHING to confirm
                <input type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={pending} className={inputClass} />
              </label>
            </div>
          )}
          {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={close} disabled={pending} className="min-h-12 rounded-lg border border-border px-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
            <button type="submit" disabled={pending || (token !== "" && confirmation !== "DELETE EVERYTHING")} className={buttonClass}>{pending ? "Checking…" : token ? "Yes, permanently delete" : "Continue"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
