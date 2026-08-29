"use server";

import { redirect } from "next/navigation";
import { loginWithPassword, logout } from "@/lib/auth";
import { DEMO_PASSWORD } from "@/lib/rbac";

export type LoginState = { error?: string } | null;

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
