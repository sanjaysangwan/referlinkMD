import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./better-auth";
import { billingFor, trialEndFrom } from "./billing";
import { db } from "./db";
import { ensureDatabase } from "./database";
import { privilegesFor } from "./rbac";
import type { OrgType, Role, SessionUser } from "./types";

export function toSessionUser(userId: string): SessionUser | null {
  const member = db.userById(userId);
  if (!member) return null;
  const org = db.organizationById(member.organizationId);
  if (!org) return null;
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    credentials: member.credentials,
    role: member.role,
    organizationId: org.id,
    organizationName: org.name,
    organizationType: org.type,
    specialty: org.specialty,
    phone: member.phone,
    privileges: privilegesFor(org.type, member.role),
    billing: billingFor(org),
  };
}

export async function getCurrentUser() {
  await ensureDatabase();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  return toSessionUser(session.user.id);
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
  await ensureDatabase();
  try {
    await auth.api.signInEmail({
      body: { email: email.trim().toLowerCase(), password },
      headers: await headers(),
    });
  } catch {
    return { error: "Email or password is incorrect." as const };
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "Email or password is incorrect." as const };
  }
  const user = toSessionUser(session.user.id);
  if (!user) {
    return { error: "Email or password is incorrect." as const };
  }
  return { user };
}

export async function logout() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Already signed out.
  }
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
  await ensureDatabase();
  if (db.userByEmail(input.email)) {
    return { error: "That email is already on ReferLinkMD." as const };
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
  const now = new Date();

  db.insertOrganization({
    id: orgId,
    name: input.practiceName.trim(),
    type: input.portal,
    specialty: input.portal === "SPECIALIST" ? input.specialty?.trim() : undefined,
    city: input.city.trim() || "—",
    phone: input.phone.trim() || "",
    subscriptionStatus: input.portal === "PCP" ? "free" : "trial",
    trialEndsAt: input.portal === "SPECIALIST" ? trialEndFrom(now) : undefined,
  });

  try {
    await auth.api.signUpEmail({
      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
        name: input.name.trim(),
        organizationId: orgId,
        role: input.role,
        credentials: input.credentials.trim() || (input.role === "MD" ? "MD" : "—"),
        phone: input.phone.trim() || "+15550000000",
      },
      headers: await headers(),
    });
  } catch {
    return { error: "Could not create that account. Try a different email." as const };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "Could not create that account. Try a different email." as const };
  }

  if (input.portal === "SPECIALIST") {
    db.updatePreferences(session.user.id, {
      smsEnabled: true,
      voiceEnabled: true,
      afterHoursVoice: true,
    });
  }

  const user = toSessionUser(session.user.id);
  if (!user) {
    return { error: "Could not create that account. Try a different email." as const };
  }
  return { user };
}
