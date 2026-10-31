"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  lockOwner,
  unlockOwner,
  updateAppExpiry,
  type OwnerUnlockState,
} from "@/app/settings/actions";

type OwnerSettingsPanelProps = {
  initial: OwnerUnlockState;
};

function remainingLabel(days: number | null, expiresOn: string | null): string {
  if (!expiresOn) return "Unlimited (no expiry set)";
  if (days == null) return `Expires on ${expiresOn}`;
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"} remaining`;
}

export function OwnerSettingsPanel({ initial }: OwnerSettingsPanelProps) {
  const router = useRouter();
  const [unlockState, unlockAction, unlockPending] = useActionState(unlockOwner, {
    ok: false,
    error: null,
  });
  const [expiryState, expiryAction, expiryPending] = useActionState(updateAppExpiry, {
    ok: false,
    error: null,
    license: null,
  });

  const license = expiryState.license ?? initial.license;
  const unlocked = initial.unlocked || unlockState.ok;

  useEffect(() => {
    if (unlockState.ok) {
      toast.success("Owner unlocked");
      router.refresh();
    }
  }, [unlockState.ok, router]);

  useEffect(() => {
    if (expiryState.ok) {
      toast.success("Expiry updated");
      router.refresh();
    }
  }, [expiryState.ok, router]);

  if (!initial.pinConfigured) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning-soft/40 px-4 py-4 text-sm text-foreground">
        <p className="font-medium">Owner PIN not configured</p>
        <p className="mt-1 text-muted">
          Set <code className="font-mono text-xs">APP_OWNER_PIN</code> in the server
          environment, then restart the app.
        </p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <form action={unlockAction} className="space-y-4">
        <p className="text-sm text-muted">
          Enter the owner PIN to view or change the app expiry date. This page stays
          available even when the app is locked.
        </p>
        <div>
          <label htmlFor="owner-pin" className="block text-sm font-medium text-foreground">
            Owner PIN
          </label>
          <input
            id="owner-pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            required
            className="mt-1.5 w-full min-h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
        {unlockState.error ? (
          <p className="text-sm text-error" role="alert">
            {unlockState.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={unlockPending}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {unlockPending ? "Checking…" : "Unlock"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <p className="text-sm font-medium text-foreground">License status</p>
        <p className="mt-1 text-sm text-muted">
          {remainingLabel(license.remainingDays, license.expiresOn)}
        </p>
        {license.expiresOn ? (
          <p className="mt-1 font-mono text-xs text-muted">Expires on {license.expiresOn}</p>
        ) : null}
        {license.isExpired ? (
          <p className="mt-2 text-sm font-medium text-error">
            App is currently locked for normal use.
          </p>
        ) : null}
      </div>

      <form action={expiryAction} className="space-y-4">
        <div>
          <label htmlFor="expires-on" className="block text-sm font-medium text-foreground">
            Expiry date
          </label>
          <p className="mt-1 text-xs text-muted">
            Access is allowed through the end of this day (Asia/Kolkata). Leave blank and
            use Clear for unlimited.
          </p>
          <input
            id="expires-on"
            name="expiresOn"
            type="date"
            defaultValue={license.expiresOn ?? ""}
            className="mt-2 w-full min-h-11 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </div>
        {expiryState.error ? (
          <p className="text-sm text-error" role="alert">
            {expiryState.error}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={expiryPending}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {expiryPending ? "Saving…" : "Save expiry"}
          </button>
          <button
            type="submit"
            name="clear"
            value="1"
            disabled={expiryPending}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
          >
            Clear expiry
          </button>
        </div>
      </form>

      <form
        action={async () => {
          await lockOwner();
          router.refresh();
        }}
      >
        <button
          type="submit"
          className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface"
        >
          Lock owner session
        </button>
      </form>
    </div>
  );
}
