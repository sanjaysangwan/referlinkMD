import { compareSync } from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "./db";
import { privilegesFor } from "./rbac";
import { clearSessionCookie, readSessionUserId, setSessionCookie } from "./session";
import type { OrgType, SessionUser } from "./types";

export function toSessionUser(userId: string): SessionUser | null {
  const user = db.userById(userId);
  if (!user) return null;
  const org = db.organizationById(user.organizationId);
  if (!org) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    credentials: user.credentials,
    role: user.role,
    organizationId: org.id,
    organizationName: org.name,
    organizationType: org.type,
    specialty: org.specialty,
    phone: user.phone,
    privileges: privilegesFor(org.type, user.role),
  };
}

export async function getCurrentUser() {
  const id = await readSessionUserId();
  if (!id) return null;
  return toSessionUser(id);
}

export async function requireUser(expected?: OrgType): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(expected === "SPECIALIST" ? "/login/specialist" : "/login/pcp");
  }
  if (expected && user.organizationType !== expected) {
    redirect(user.organizationType === "PCP" ? "/pcp" : "/specialist");
  }
  return user;
}

export async function loginWithPassword(email: string, password: string) {
  const user = db.userByEmail(email.trim());
  if (!user || !compareSync(password, user.passwordHash)) {
    return { error: "Email or password is incorrect." as const };
  }
  await setSessionCookie(user.id);
  const session = toSessionUser(user.id)!;
  return { user: session };
}

export async function logout() {
  await clearSessionCookie();
}
