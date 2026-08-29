"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { specialistBillingEnabled } from "@/lib/billing";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";

export async function startSpecialistSubscriptionAction() {
  if (!specialistBillingEnabled()) {
    redirect("/specialist");
  }
  const user = await requireUser("SPECIALIST");
  if (!can(user, "MANAGE_BILLING")) {
    redirect("/specialist/billing?error=privilege");
  }
  db.updateOrganization(user.organizationId, {
    subscriptionStatus: "active",
    subscribedAt: new Date().toISOString(),
  });
  revalidatePath("/specialist");
  revalidatePath("/specialist/billing");
  redirect("/specialist/billing?paid=1");
}
