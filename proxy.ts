import { NextResponse, type NextRequest } from "next/server";

import { isAppExpired } from "@/lib/app-license";

function isLicenseExemptPath(pathname: string): boolean {
  if (
    pathname === "/expired" ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/")
  ) {
    return true;
  }

  // Next internals & static public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/sounds") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/menu-themes") ||
    pathname.startsWith("/menu-category-images") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest"
  ) {
    return true;
  }

  // Common static file extensions under /public
  if (/\.(?:png|jpe?g|gif|webp|svg|ico|css|js|map|woff2?|ttf|mp3|wav)$/i.test(pathname)) {
    return true;
  }

  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/expired") {
    try {
      if (!(await isAppExpired())) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
      }
    } catch {
      // Stay on expired screen if status cannot be read.
    }
    return NextResponse.next();
  }

  if (isLicenseExemptPath(pathname)) {
    return NextResponse.next();
  }

  try {
    if (await isAppExpired()) {
      const url = request.nextUrl.clone();
      url.pathname = "/expired";
      url.search = "";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // Fail closed for normal app use if license check cannot run.
    console.error("[license] expiry check failed:", error);
    const url = request.nextUrl.clone();
    url.pathname = "/expired";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except hashed Next static assets.
     * Exemption logic for /settings and /expired lives above.
     */
    "/((?!_next/static|_next/image).*)",
  ],
};
