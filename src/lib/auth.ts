import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { practiceMemberships, practices, users } from "@/db/schema";
import { getDb } from "@/db";
import {
  IDLE_SECONDS,
  MFA_COOKIE,
  SESSION_COOKIE,
  issueSessionToken,
  sessionCookieName,
  sessionCookieOptions,
  signAuthToken,
  verifyAuthToken,
} from "./auth-cookie";
import type { PracticeRole, SessionUser } from "./types";

export { issueSessionToken, sessionCookieName, sessionCookieOptions } from "./auth-cookie";

async function setCookie(name: string, token: string, maxAge: number) {
  const jar = await cookies();
  jar.set(name, token, sessionCookieOptions(maxAge));
}

export async function createSession(userId: string) {
  const token = await issueSessionToken(userId);
  await setCookie(SESSION_COOKIE, token, IDLE_SECONDS);
}

export async function createMfaPending(userId: string) {
  const token = await signAuthToken({ sub: userId, purpose: "mfa" }, "5m");
  await setCookie(MFA_COOKIE, token, 5 * 60);
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(MFA_COOKIE);
}

export async function readMfaPendingUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(MFA_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await verifyAuthToken(token);
    if (payload.purpose !== "mfa") return null;
    return String(payload.sub);
  } catch {
    return null;
  }
}

export async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status === "disabled") return null;

  const [membership] = await db
    .select()
    .from(practiceMemberships)
    .where(and(eq(practiceMemberships.userId, user.id), eq(practiceMemberships.status, "active")))
    .limit(1);

  let practiceName: string | null = null;
  let practiceLogo: string | null = null;
  let isPracticeCreator = false;
  if (membership) {
    const [practice] = await db
      .select()
      .from(practices)
      .where(eq(practices.id, membership.practiceId))
      .limit(1);
    practiceName = practice?.name ?? null;
    practiceLogo = practice?.logo ?? null;
    isPracticeCreator = practice?.createdByUserId === user.id;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    npi: user.npi,
    mobilePhone: user.mobilePhone,
    practiceId: membership?.practiceId ?? null,
    practiceName,
    practiceLogo,
    role: (membership?.role as PracticeRole | undefined) ?? null,
    isPracticeCreator,
    mustChangePassword: user.mustChangePassword,
    mfaEnabled: Boolean(user.mfaEnabledAt),
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (!token) return null;
  try {
    const { payload } = await verifyAuthToken(token);
    if (payload.purpose !== "session") return null;
    return loadSessionUser(String(payload.sub));
  } catch {
    return null;
  }
}

export function homePath(session: SessionUser): string {
  if (session.mustChangePassword) return "/password";
  if (!session.mfaEnabled) return "/mfa/setup";
  return "/consults";
}
