import { eq } from "drizzle-orm";
import { randomInt } from "crypto";
import { users } from "@/db/schema";
import { getDb } from "@/db";
import { sha256Hex } from "./crypto";
import { formatPhone } from "./phone";
import { sendDemoMessage } from "./outbox";
import { APP_NAME } from "./brand";
import { isDemo } from "./env";

export type MfaMethod = "totp" | "sms";

const SMS_OTP_TTL_MS = 10 * 60 * 1000;
const SMS_RESEND_COOLDOWN_MS = 30 * 1000;

export function resolveMfaMethod(user: {
  mfaMethod: string | null;
  mfaSecretEncrypted: string | null;
  mfaEnabledAt: Date | null;
}): MfaMethod {
  if (user.mfaMethod === "sms" || user.mfaMethod === "totp") return user.mfaMethod;
  if (user.mfaEnabledAt && user.mfaSecretEncrypted) return "totp";
  return "totp";
}

export function maskPhone(e164: string): string {
  const formatted = formatPhone(e164);
  if (formatted.startsWith("(")) {
    return `(***) ***-${formatted.slice(-4)}`;
  }
  return `***${e164.slice(-4)}`;
}

function generateSmsCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function issueSmsMfaCode(input: {
  userId: string;
  phone: string;
}): Promise<{ ok: true; demoCode?: string } | { ok: false; error: string; status: number }> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user) return { ok: false, error: "Account not found.", status: 404 };

  if (user.mfaSmsCodeExpiresAt) {
    const issuedAt = user.mfaSmsCodeExpiresAt.getTime() - SMS_OTP_TTL_MS;
    if (Date.now() - issuedAt < SMS_RESEND_COOLDOWN_MS) {
      return { ok: false, error: "Wait a moment before requesting another code.", status: 429 };
    }
  }

  const code = generateSmsCode();
  const expiresAt = new Date(Date.now() + SMS_OTP_TTL_MS);
  await db
    .update(users)
    .set({
      mfaSmsCodeHash: sha256Hex(code),
      mfaSmsCodeExpiresAt: expiresAt,
    })
    .where(eq(users.id, input.userId));

  await sendDemoMessage({
    channel: "sms",
    toAddress: input.phone,
    templateKey: "mfa_sms_otp",
    body: `${APP_NAME} verification code: ${code}. Expires in 10 minutes.`,
    toPhone: input.phone,
  });

  return { ok: true, demoCode: isDemo() ? code : undefined };
}

export async function verifySmsMfaCode(input: {
  userId: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user?.mfaSmsCodeHash || !user.mfaSmsCodeExpiresAt) {
    return { ok: false, error: "Request a new SMS code." };
  }
  if (user.mfaSmsCodeExpiresAt.getTime() < Date.now()) {
    return { ok: false, error: "That code expired. Request a new one." };
  }
  if (sha256Hex(input.code) !== user.mfaSmsCodeHash) {
    return { ok: false, error: "Invalid SMS code." };
  }

  await db
    .update(users)
    .set({ mfaSmsCodeHash: null, mfaSmsCodeExpiresAt: null })
    .where(eq(users.id, input.userId));

  return { ok: true };
}
