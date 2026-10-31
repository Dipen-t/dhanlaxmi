"use server";

import { revalidatePath } from "next/cache";

import {
  getAppLicenseStatus,
  setAppExpiresOn,
  type AppLicenseStatus,
} from "@/lib/app-license";
import {
  clearOwnerUnlockedCookie,
  isOwnerPinConfigured,
  isOwnerUnlocked,
  requireOwnerUnlocked,
  setOwnerUnlockedCookie,
  verifyOwnerPin,
} from "@/lib/owner-auth";

export type OwnerUnlockState = {
  pinConfigured: boolean;
  unlocked: boolean;
  license: AppLicenseStatus;
};

export async function getOwnerSettingsState(): Promise<OwnerUnlockState> {
  const [unlocked, license] = await Promise.all([
    isOwnerUnlocked(),
    getAppLicenseStatus(),
  ]);

  return {
    pinConfigured: isOwnerPinConfigured(),
    unlocked,
    license,
  };
}

export async function unlockOwner(
  _prev: { ok: boolean; error: string | null },
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  if (!isOwnerPinConfigured()) {
    return {
      ok: false,
      error: "Owner PIN is not configured. Set APP_OWNER_PIN on the server.",
    };
  }

  const pin = String(formData.get("pin") ?? "");
  if (!pin.trim()) {
    return { ok: false, error: "Enter the owner PIN." };
  }

  if (!verifyOwnerPin(pin)) {
    return { ok: false, error: "Incorrect PIN." };
  }

  await setOwnerUnlockedCookie();
  revalidatePath("/settings");
  return { ok: true, error: null };
}

export async function lockOwner(): Promise<void> {
  await clearOwnerUnlockedCookie();
  revalidatePath("/settings");
}

export async function updateAppExpiry(
  _prev: { ok: boolean; error: string | null; license: AppLicenseStatus | null },
  formData: FormData,
): Promise<{ ok: boolean; error: string | null; license: AppLicenseStatus | null }> {
  try {
    await requireOwnerUnlocked();
  } catch {
    return { ok: false, error: "Owner unlock required.", license: null };
  }

  const clear = formData.get("clear") === "1";
  const raw = String(formData.get("expiresOn") ?? "");

  try {
    const license = await setAppExpiresOn(clear ? null : raw || null);
    revalidatePath("/settings");
    revalidatePath("/expired");
    revalidatePath("/");
    return { ok: true, error: null, license };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update expiry.";
    return { ok: false, error: message, license: null };
  }
}
