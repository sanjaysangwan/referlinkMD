"use server";

import { redirect } from "next/navigation";
import { loginWithPassword, logout, signupPractice } from "@/lib/auth";
import { DEMO_PASSWORD } from "@/lib/rbac";
import type { OrgType, Role } from "@/lib/types";

export type LoginState = { error?: string } | null;
export type SignupState = { error?: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const portal = String(formData.get("portal") || "pcp");
  if (!email || !password) return { error: "Enter email and password." };

  const result = await loginWithPassword(email, password);
  if ("error" in result) return result;

  const expected = portal === "specialist" ? "SPECIALIST" : "PCP";
  if (result.user.organizationType !== expected) {
    await logout();
    return {
      error:
        expected === "PCP"
          ? "This account belongs to a specialist practice. Use the specialist portal."
          : "This account belongs to a primary care practice. Use the PCP portal.",
    };
  }

  redirect(expected === "PCP" ? "/pcp" : "/specialist");
}

export async function demoLoginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const portal = String(formData.get("portal") || "pcp");
  const result = await loginWithPassword(email, DEMO_PASSWORD);
  if ("error" in result) {
    redirect(`/login/${portal}?error=demo`);
  }
  const expected = portal === "specialist" ? "SPECIALIST" : "PCP";
  if (result.user.organizationType !== expected) {
    await logout();
    redirect(`/login/${portal}?error=portal`);
  }
  redirect(expected === "PCP" ? "/pcp" : "/specialist");
}

export async function logoutAction() {
  await logout();
  redirect("/");
}

const ROLES: Role[] = ["MD", "MIDLEVEL", "OFFICE_MANAGER", "STAFF"];

export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const portal: OrgType = formData.get("portal") === "specialist" ? "SPECIALIST" : "PCP";
  const roleRaw = String(formData.get("role") || "MD");
  const role = ROLES.includes(roleRaw as Role) ? (roleRaw as Role) : "MD";

  const result = await signupPractice({
    portal,
    practiceName: String(formData.get("practiceName") || ""),
    city: String(formData.get("city") || ""),
    phone: String(formData.get("phone") || ""),
    specialty: String(formData.get("specialty") || ""),
    name: String(formData.get("name") || ""),
    credentials: String(formData.get("credentials") || ""),
    role,
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  });

  if ("error" in result) return result;
  redirect(portal === "PCP" ? "/pcp" : "/specialist");
}
