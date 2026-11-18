"use server";

import { spawn } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createRemovalConfirmation,
  getRemovalTarget,
  verifyDeletionPassword,
  verifyRemovalConfirmation,
} from "@/lib/local-app-removal";

let failures = 0;
let blockedUntil = 0;

export async function getLocalRemovalState() {
  try {
    await getRemovalTarget();
    return { available: true, reason: "" };
  } catch (error) {
    return { available: false, reason: error instanceof Error ? error.message : "Local removal is unavailable." };
  }
}

export async function unlockLocalRemoval(password: string) {
  try {
    const target = await getRemovalTarget();
    if (Date.now() < blockedUntil) return { error: "Too many attempts. Wait five minutes before trying again." };
    if (typeof password !== "string" || password.length > 1024 || !verifyDeletionPassword(password, process.env.APP_DELETE_PASSWORD ?? "")) {
      failures++;
      if (failures >= 5) { blockedUntil = Date.now() + 300_000; failures = 0; }
      return { error: "Incorrect deletion password." };
    }
    failures = 0;
    return { token: createRemovalConfirmation(process.env.APP_DELETE_PASSWORD!, target) };
  } catch {
    return { error: "Local removal is not configured on this device." };
  }
}

export async function removeLocalInstallation(token: string, confirmation: string) {
  try {
    const target = await getRemovalTarget();
    if (typeof token !== "string" || token.length > 256 || confirmation !== "DELETE EVERYTHING" || !verifyRemovalConfirmation(token, process.env.APP_DELETE_PASSWORD!, target)) {
      return { error: "Confirmation expired or is incorrect. Enter the password again." };
    }
    const stateDir = join(target.home, ".local", "state", "dhanlaxmi-removal");
    await mkdir(stateDir, { recursive: true, mode: 0o700 });
    const worker = join(stateDir, "worker.cjs");
    const job = join(stateDir, "job.json");
    const source = await readFile(join(target.root, "scripts", "local-app-removal.cjs"));
    try {
      await writeFile(job, JSON.stringify(target), { flag: "wx", mode: 0o600 });
    } catch {
      return { error: "A removal is already queued. Check the device's removal status before retrying." };
    }
    try {
      await writeFile(worker, source, { mode: 0o700 });
      // An intermediate launcher exits immediately, so PM2 cannot kill the
      // cleanup worker as a descendant when it stops the Next.js process.
      const launcher = "const c=require('node:child_process').spawn(process.execPath,process.argv.slice(1),{detached:true,stdio:'ignore',cwd:process.cwd(),env:process.env});c.once('error',()=>process.exit(1));c.once('spawn',()=>c.unref());";
      const child = spawn(process.execPath, ["-e", launcher, worker, job], { cwd: stateDir, detached: true, stdio: "ignore", env: { NODE_ENV: process.env.NODE_ENV, HOME: target.home, PATH: process.env.PATH, PREFIX: join(target.home, "..", "usr") } });
      await new Promise<void>((resolve, reject) => {
        child.once("exit", (code) => code === 0 ? resolve() : reject(new Error("Removal launcher failed")));
        child.once("error", reject);
      });
      child.unref();
    } catch {
      await unlink(job);
      return { error: "Could not start local removal. Nothing has been deleted." };
    }
    return { started: true };
  } catch {
    return { error: "Could not prepare removal. Check the local configuration." };
  }
}
