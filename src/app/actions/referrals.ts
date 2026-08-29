"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifySpecialistPractice } from "@/lib/notifications";
import { can } from "@/lib/rbac";
import type { Referral, ReferralStatus, Urgency } from "@/lib/types";

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export type ReferralState = { error?: string } | null;

export async function createReferralAction(
  _prev: ReferralState,
  formData: FormData,
): Promise<ReferralState> {
  const user = await requireUser("PCP");
  if (!can(user, "CREATE_REFERRAL")) {
    return { error: "Your role cannot create referrals." };
  }

  const patientId = String(formData.get("patientId") || "");
  const specialistOrganizationId = String(formData.get("specialistOrganizationId") || "");
  const urgency = String(formData.get("urgency") || "ROUTINE") as Urgency;
  const reason = String(formData.get("reason") || "").trim();
  const clinicalSummary = can(user, "VIEW_CLINICAL")
    ? String(formData.get("clinicalSummary") || "").trim()
    : "";

  const patient = db.patientById(patientId);
  const dest = db.organizationById(specialistOrganizationId);
  if (!patient || patient.pcpOrganizationId !== user.organizationId) {
    return { error: "Select a patient from this practice." };
  }
  if (!dest || dest.type !== "SPECIALIST") {
    return { error: "Select a specialist practice." };
  }
  if (reason.length < 8) {
    return { error: "Add a short reason for referral." };
  }

  const seq = 10000 + db.referrals().length + 1;
  const now = new Date().toISOString();
  const referral: Referral = {
    id: id("ref"),
    displayId: `HB-${seq}`,
    patientId,
    referringUserId: user.id,
    referringOrganizationId: user.organizationId,
    specialistOrganizationId,
    specialty: dest.specialty || "Specialty care",
    reason,
    clinicalSummary,
    urgency: ["ROUTINE", "SOON", "URGENT"].includes(urgency) ? urgency : "ROUTINE",
    status: "ALERTED",
    createdAt: now,
    updatedAt: now,
  };

  db.insertReferral(referral);
  await notifySpecialistPractice(referral, user.organizationName);

  revalidatePath("/pcp");
  revalidatePath("/pcp/referrals");
  revalidatePath("/specialist");
  redirect(`/pcp/referrals/${referral.id}?sent=1`);
}

export async function updateReferralStatusAction(formData: FormData) {
  const user = await requireUser("SPECIALIST");
  const referralId = String(formData.get("referralId") || "");
  const status = String(formData.get("status") || "") as ReferralStatus;
  const referral = db.referralById(referralId);
  if (!referral || referral.specialistOrganizationId !== user.organizationId) {
    redirect("/specialist");
  }

  if (status === "ACCEPTED" || status === "DECLINED") {
    if (!can(user, "ACCEPT_REFERRAL")) {
      redirect(`/specialist/referrals/${referralId}?error=privilege`);
    }
  }
  if (status === "SCHEDULED" && !can(user, "SCHEDULE_REFERRAL")) {
    redirect(`/specialist/referrals/${referralId}?error=privilege`);
  }

  const patch: Partial<Referral> = { status };
  if (status === "ACCEPTED") {
    patch.acceptedAt = new Date().toISOString();
    patch.assignedSpecialistUserId = user.role === "STAFF" ? referral.assignedSpecialistUserId : user.id;
  }
  if (status === "SCHEDULED") {
    patch.scheduledAt = new Date().toISOString();
    if (!referral.acceptedAt) patch.acceptedAt = new Date().toISOString();
  }

  db.updateReferral(referralId, patch);
  revalidatePath("/specialist");
  revalidatePath(`/specialist/referrals/${referralId}`);
  redirect(`/specialist/referrals/${referralId}`);
}

export async function updateAlertPreferencesAction(formData: FormData) {
  const user = await requireUser();
  if (!can(user, "MANAGE_ALERTS")) {
    redirect(user.organizationType === "PCP" ? "/pcp" : "/specialist");
  }
  db.updatePreferences(user.id, {
    smsEnabled: formData.get("smsEnabled") === "on",
    voiceEnabled: formData.get("voiceEnabled") === "on",
    afterHoursVoice: formData.get("afterHoursVoice") === "on",
  });
  revalidatePath("/pcp/alerts");
  revalidatePath("/specialist/alerts");
}
