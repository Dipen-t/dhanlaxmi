import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { homedir } from "node:os";
import { posix } from "node:path";
import { access, realpath } from "node:fs/promises";

export type RemovalTarget = { root: string; home: string; database: string; databaseUrl: string; psql: string; pm2: string };

export function validateRemovalEnvironment(env: NodeJS.ProcessEnv, platform: string, home: string, cwd: string): RemovalTarget {
  if (env.VERCEL || !["linux", "android"].includes(platform) || !/^\/data\/(?:data|user\/\d+)\/com\.termux\/files\/home$/.test(home)) {
    throw new Error("Removal is available only on the client's Termux installation.");
  }
  if (env.LOCAL_APP_DELETE_ENABLED !== "true") throw new Error("Local removal has not been enabled on this device.");
  if (!env.APP_DELETE_PASSWORD || env.APP_DELETE_PASSWORD.length < 12) throw new Error("Configure a separate deletion password of at least 12 characters.");
  const root = posix.join(home, "apps", "dhanlaxmi-master");
  if (cwd !== root) throw new Error("Removal requires the app to run from ~/apps/dhanlaxmi-master.");
  const databaseUrl = env.DATABASE_URL ?? env.NEON_URL ?? "";
  let url: URL;
  try { url = new URL(databaseUrl); } catch { throw new Error("The local database connection is not configured."); }
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.search || url.hash) {
    throw new Error("Removal requires a local PostgreSQL database with no connection URL overrides. Remote databases cannot be deleted here.");
  }
  if (!/^[A-Za-z0-9_-]+$/.test(database) || ["postgres", "template0", "template1"].includes(database.toLowerCase()) || env.LOCAL_APP_DELETE_DATABASE !== database) {
    throw new Error("LOCAL_APP_DELETE_DATABASE must explicitly name this app's local database.");
  }
  const prefix = posix.join(home, "..", "usr");
  return { root, home, database, databaseUrl, psql: posix.join(prefix, "bin", "psql"), pm2: posix.join(prefix, "bin", "pm2") };
}

export async function getRemovalTarget() {
  const target = validateRemovalEnvironment(process.env, process.platform, homedir(), process.cwd());
  if (await realpath(target.root) !== target.root) throw new Error("The app folder must not be a symbolic link.");
  await access(target.psql);
  return target;
}

function equal(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export function verifyDeletionPassword(value: string, expected: string) {
  return expected.length >= 12 && equal(value, expected);
}

function signature(payload: string, password: string, target: RemovalTarget) {
  return createHmac("sha256", password).update(`${payload}\n${target.root}\n${target.databaseUrl}`).digest("hex");
}

export function createRemovalConfirmation(password: string, target: RemovalTarget, now = Date.now()) {
  const payload = `${now + 120_000}.${randomBytes(24).toString("hex")}`;
  return `${payload}.${signature(payload, password, target)}`;
}

export function verifyRemovalConfirmation(token: string, password: string, target: RemovalTarget, now = Date.now()) {
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[0]) || !/^[a-f0-9]{48}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const expires = Number(parts[0]);
  return expires > now && expires <= now + 120_000 && equal(parts[2], signature(`${parts[0]}.${parts[1]}`, password, target));
}
