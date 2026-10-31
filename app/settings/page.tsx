import Link from "next/link";

import { OwnerSettingsPanel } from "@/components/settings/owner-settings-panel";

import { getOwnerSettingsState } from "./actions";

export const metadata = {
  title: "Owner settings",
};

export default async function SettingsPage() {
  const initial = await getOwnerSettingsState();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 sm:px-8 sm:py-10">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Owner</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          App license
        </h1>
        <p className="mt-2 text-sm text-muted">
          Set or extend the expiry date that controls tablet access.
        </p>
      </header>

      <OwnerSettingsPanel initial={initial} />

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
