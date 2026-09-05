import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  issueSessionToken,
  sessionCookieName,
  sessionCookieOptions,
  verifyAuthToken,
} from "@/lib/auth-cookie";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(sessionCookieName())?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await verifyAuthToken(token);
    if (payload.purpose !== "session") throw new Error("bad purpose");
    const res = NextResponse.next();
    const refreshed = await issueSessionToken(String(payload.sub));
    res.cookies.set(sessionCookieName(), refreshed, sessionCookieOptions());
    return res;
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/practice/:path*",
    "/consults/:path*",
    "/inbox/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/password/:path*",
    "/mfa/:path*",
    "/demo/:path*",
    "/api/consults/:path*",
    "/api/inbox",
    "/api/inbox/:path*",
    "/api/team/:path*",
    "/api/practice",
    "/api/practice/:path*",
    "/api/me",
    "/api/me/:path*",
    "/api/invites",
    "/api/outbox/:path*",
    "/api/auth/password",
    "/api/auth/mfa/setup",
  ],
};
