import { SignJWT, jwtVerify } from "jose";
import { authSecret } from "./env";

export const SESSION_COOKIE = "referlink_session";
export const MFA_COOKIE = "referlink_mfa";
export const IDLE_SECONDS = 15 * 60;

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}

export function authKey() {
  return new TextEncoder().encode(authSecret());
}

export async function signAuthToken(payload: Record<string, string>, expiresIn: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(authKey());
}

export async function issueSessionToken(userId: string): Promise<string> {
  return signAuthToken({ sub: userId, purpose: "session" }, `${IDLE_SECONDS}s`);
}

export function sessionCookieOptions(maxAge = IDLE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function verifyAuthToken(token: string) {
  return jwtVerify(token, authKey());
}
