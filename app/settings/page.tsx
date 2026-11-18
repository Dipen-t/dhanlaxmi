import Link from "next/link";
import { connection } from "next/server";

import { OwnerSettingsPanel } from "@/components/settings/owner-settings-panel";
import { LocalRemovalPanel } from "@/components/settings/local-removal-panel";

import { getOwnerSettingsState } from "./actions";
import { getLocalRemovalState } from "./removal-actions";

export const metadata = {
  title: "Owner settings",
};

export default async function SettingsPage() {
  await connection();
  const initial = await getOwnerSettingsState();
  const removal = await getLocalRemovalState();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 sm:px-8 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Owner</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          Owner settings
        </h1>
        <p className="mt-2 text-sm text-muted">
          Manage tablet access and the local installation.
        </p>
      </header>

      <OwnerSettingsPanel initial={initial} />
      <LocalRemovalPanel {...removal} />

      <p className="mt-10 text-center text-sm text-muted">
        <Link href="/" className="text-primary underline-offset-2 hover:underline">
          Back to home
        </Link>
        {initial.license.isExpired ? (
          <>
            {" · "}
            <Link href="/expired" className="underline-offset-2 hover:underline">
              Locked screen
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
