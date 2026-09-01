import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";

const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret() {
  return process.env.AUTH_SECRET || "referlinkmd-prototype-secret-change-in-prod";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function encodeSession(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sub: string;
      exp: number;
    };
    if (data.exp < Date.now()) return null;
    return data.sub;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionUserId() {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
