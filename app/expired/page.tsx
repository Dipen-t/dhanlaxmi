import Link from "next/link";
import Image from "next/image";

import logo from "@/app/logo.png";
import { getAppLicenseStatus } from "@/lib/app-license";

export const metadata = {
  title: "Access expired",
};

export default async function ExpiredPage() {
  const license = await getAppLicenseStatus();

  // If somehow visited while not expired, send users home via link only (proxy
  // already allows this route). Still show a calm message when expired.
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Image
          src={logo}
          alt="Dhan Laxmi Catering Service"
          className="mx-auto h-20 w-auto object-contain opacity-90"
          priority
        />
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">
          App access expired
        </h1>
        <p className="mt-3 text-base text-muted">
          This installation is locked. Please contact your provider to renew access.
        </p>
        {license.expiresOn ? (
          <p className="mt-4 font-mono text-xs text-muted">
            Expired on {license.expiresOn}
          </p>
        ) : null}

        {!license.isExpired ? (
          <p className="mt-8">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Continue to app
            </Link>
          </p>
        ) : null}

        <p className="mt-10 text-xs text-muted">
          <Link
            href="/settings"
            className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Owner settings
          </Link>
        </p>
      </div>
    </div>
  );
}
