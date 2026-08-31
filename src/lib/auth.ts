import { compareSync, hashSync } from "bcryptjs";
import { redirect } from "next/navigation";
import { billingFor, trialEndFrom } from "./billing";
import { db } from "./db";
import { privilegesFor } from "./rbac";
import { clearSessionCookie, readSessionUserId, setSessionCookie } from "./session";
import type { OrgType, Role, SessionUser } from "./types";

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
    billing: billingFor(org),
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

export type SignupInput = {
  portal: OrgType;
  practiceName: string;
  city: string;
  phone: string;
  specialty?: string;
  name: string;
  credentials: string;
  role: Role;
  email: string;
  password: string;
};

export async function signupPractice(input: SignupInput) {
  if (db.userByEmail(input.email)) {
    return { error: "That email is already on ReferMDLink." as const };
  }
  if (input.password.length < 8) {
    return { error: "Use a password of at least 8 characters." as const };
  }
  if (!input.practiceName.trim() || !input.name.trim()) {
    return { error: "Practice name and your name are required." as const };
  }
  if (input.portal === "SPECIALIST" && !input.specialty?.trim()) {
    return { error: "Choose a specialty." as const };
  }

  const orgId = `org_${Math.random().toString(36).slice(2, 10)}`;
  const userId = `user_${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date();

  db.insertOrganization({
    id: orgId,
    name: input.practiceName.trim(),
    type: input.portal,
    specialty: input.portal === "SPECIALIST" ? input.specialty?.trim() : undefined,
    city: input.city.trim() || "—",
    phone: input.phone.trim() || "",
    // Always record the specialist trial clock so flipping
    // SPECIALIST_BILLING_ENABLED later does not need a data migration.
    subscriptionStatus: input.portal === "PCP" ? "free" : "trial",
    trialEndsAt: input.portal === "SPECIALIST" ? trialEndFrom(now) : undefined,
  });

  db.insertUser({
    id: userId,
    email: input.email.trim().toLowerCase(),
    passwordHash: hashSync(input.password, 10),
    name: input.name.trim(),
    credentials: input.credentials.trim() || (input.role === "MD" ? "MD" : "—"),
    role: input.role,
    organizationId: orgId,
    phone: input.phone.trim() || "+15550000000",
  });

  if (input.portal === "SPECIALIST") {
    db.updatePreferences(userId, { smsEnabled: true, voiceEnabled: true, afterHoursVoice: true });
  }

  await setSessionCookie(userId);
  return { user: toSessionUser(userId)! };
}
