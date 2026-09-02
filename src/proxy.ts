import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session =
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get(`__Secure-${SESSION_COOKIE}`)?.value;
  const isApp = pathname.startsWith("/pcp") || pathname.startsWith("/specialist");

  if (isApp && !session) {
    const portal = pathname.startsWith("/specialist") ? "specialist" : "pcp";
    return NextResponse.redirect(new URL(`/login/${portal}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pcp/:path*", "/specialist/:path*"],
};
