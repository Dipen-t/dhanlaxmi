import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appSettings } from "@/db/schema";

import {
  daysRemaining,
  isPastExpiry,
  normalizeExpiresOn,
} from "@/lib/app-license-dates";

export {
  APP_TIME_ZONE,
  daysRemaining,
  isPastExpiry,
  normalizeExpiresOn,
  todayInAppTz,
} from "@/lib/app-license-dates";

const SETTINGS_ID = 1;

export type AppLicenseStatus = {
  expiresOn: string | null;
  isExpired: boolean;
  remainingDays: number | null;
};

async function ensureSettingsRow() {
  const existing = await db.query.appSettings.findFirst({
    where: eq(appSettings.id, SETTINGS_ID),
  });
  if (existing) return existing;

  await db.insert(appSettings).values({
    id: SETTINGS_ID,
    expiresOn: null,
  });

  const created = await db.query.appSettings.findFirst({
    where: eq(appSettings.id, SETTINGS_ID),
  });
  if (!created) {
    throw new Error("Failed to initialize app settings.");
  }
  return created;
}

export async function getAppLicenseStatus(): Promise<AppLicenseStatus> {
  const row = await ensureSettingsRow();
  const expiresOn = row.expiresOn ?? null;
  const remaining = daysRemaining(expiresOn);

  return {
    expiresOn,
    isExpired: isPastExpiry(expiresOn),
    remainingDays: remaining,
  };
}

export async function setAppExpiresOn(expiresOn: string | null): Promise<AppLicenseStatus> {
  const normalized = normalizeExpiresOn(expiresOn);
  await ensureSettingsRow();
  await db
    .update(appSettings)
    .set({
      expiresOn: normalized,
      updatedAt: new Date(),
    })
    .where(eq(appSettings.id, SETTINGS_ID));

  return getAppLicenseStatus();
}

export async function isAppExpired(): Promise<boolean> {
  const status = await getAppLicenseStatus();
  return status.isExpired;
}
