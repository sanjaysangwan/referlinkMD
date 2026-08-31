import { APP_NAME } from "./constants";
import { db } from "./db";
import type { AlertChannel, AlertLog, Referral, User } from "./types";

function hasTwilio() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

async function deliverMock(alert: Omit<AlertLog, "id" | "status" | "createdAt" | "provider">) {
  const record: AlertLog = {
    ...alert,
    id: newId("alert"),
    status: "DELIVERED",
    createdAt: new Date().toISOString(),
    provider: hasTwilio() ? "twilio" : "mock",
  };
  db.insertAlert(record);
  return record;
}

export async function notifySpecialistPractice(referral: Referral, referringOrgName: string) {
  const specialistOrg = db.organizationById(referral.specialistOrganizationId);
  if (!specialistOrg) return [];

  const recipients = db
    .users()
    .filter((u) => u.organizationId === specialistOrg.id)
    .filter((u) => {
      const pref = db.preferencesFor(u.id);
      return pref.smsEnabled || pref.voiceEnabled;
    });

  const sent: AlertLog[] = [];
  for (const user of recipients) {
    const pref = db.preferencesFor(user.id);
    const smsBody = `${APP_NAME}: New ${referral.urgency.toLowerCase()} ${referral.specialty} referral ${referral.displayId} from ${referringOrgName}. Open ${APP_NAME} to review.`;
    const voiceBody = `New ${referral.urgency.toLowerCase()} referral ${referral.displayId} is waiting in the ${specialistOrg.name} queue.`;

    if (pref.smsEnabled) {
      sent.push(
        await deliverMock({
          referralId: referral.id,
          organizationId: specialistOrg.id,
          recipientUserId: user.id,
          channel: "SMS",
          to: user.phone,
          message: smsBody,
        }),
      );
    }

    const shouldCall =
      pref.voiceEnabled && (referral.urgency === "URGENT" || pref.afterHoursVoice);
    if (shouldCall) {
      sent.push(
        await deliverMock({
          referralId: referral.id,
          organizationId: specialistOrg.id,
          recipientUserId: user.id,
          channel: "VOICE",
          to: user.phone,
          message: voiceBody,
        }),
      );
    }
  }

  return sent;
}

export function channelLabel(channel: AlertChannel) {
  return channel === "SMS" ? "Text message" : "Phone call";
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function recipientName(user: User | null) {
  return user ? `${user.name}, ${user.credentials}` : "Unknown";
}
