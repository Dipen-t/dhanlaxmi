import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const OWNER_COOKIE_NAME = "dl_owner_access";

const OWNER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

function getOwnerPin(): string | null {
  const pin = process.env.APP_OWNER_PIN?.trim();
  return pin ? pin : null;
}

export function isOwnerPinConfigured(): boolean {
  return getOwnerPin() !== null;
}

function cookieTokenForPin(pin: string): string {
  return createHmac("sha256", pin).update("dhanlaxmi-owner-access-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyOwnerPin(pin: string): boolean {
  const expected = getOwnerPin();
  if (!expected) return false;
  return safeEqual(pin.trim(), expected);
}

export async function isOwnerUnlocked(): Promise<boolean> {
  const pin = getOwnerPin();
  if (!pin) return false;

  const jar = await cookies();
  const value = jar.get(OWNER_COOKIE_NAME)?.value;
  if (!value) return false;

  return safeEqual(value, cookieTokenForPin(pin));
}

export async function setOwnerUnlockedCookie(): Promise<void> {
  const pin = getOwnerPin();
  if (!pin) {
    throw new Error("APP_OWNER_PIN is not configured.");
  }

  const jar = await cookies();
  jar.set(OWNER_COOKIE_NAME, cookieTokenForPin(pin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OWNER_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearOwnerUnlockedCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(OWNER_COOKIE_NAME);
}

export async function requireOwnerUnlocked(): Promise<void> {
  if (!(await isOwnerUnlocked())) {
    throw new Error("Owner unlock required.");
  }
}
