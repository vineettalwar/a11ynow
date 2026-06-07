import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";

const GERMAN_PREFIX = "/de";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === GERMAN_PREFIX || pathname.startsWith(`${GERMAN_PREFIX}/`)) {
    const stripped = pathname.slice(GERMAN_PREFIX.length) || "/";
    const url = request.nextUrl.clone();
    url.pathname = stripped;

    const response = NextResponse.rewrite(url);
    response.cookies.set(LOCALE_COOKIE, "de", { path: "/", sameSite: "lax" });
    response.headers.set("x-locale", "de");
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, "en", { path: "/", sameSite: "lax" });
  response.headers.set("x-locale", "en");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
