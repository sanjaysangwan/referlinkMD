import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Secret, TOTP } from "otpauth";
import { users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { newTotp, totpQrDataUrl } from "@/lib/clinician";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import { APP_NAME } from "@/lib/brand";
import { toE164 } from "@/lib/phone";
import { issueSmsMfaCode, maskPhone, verifySmsMfaCode } from "@/lib/mfa";

const totpStartSchema = z.object({
  method: z.literal("totp"),
  step: z.literal("start"),
});

const totpConfirmSchema = z.object({
  method: z.literal("totp"),
  step: z.literal("confirm"),
  code: z.string().regex(/^\d{6}$/),
});

const smsSendSchema = z.object({
  method: z.literal("sms"),
  step: z.literal("send"),
  phone: z.string().min(7),
});

const smsConfirmSchema = z.object({
  method: z.literal("sms"),
  step: z.literal("confirm"),
  code: z.string().regex(/^\d{6}$/),
  phone: z.string().min(7).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.mfaEnabled) {
    return NextResponse.json({ alreadyEnabled: true });
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  return NextResponse.json({
    alreadyEnabled: false,
    mobilePhone: user?.mobilePhone ?? null,
    maskedMobile: user?.mobilePhone ? maskPhone(user.mobilePhone) : null,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.mfaEnabled) {
    return NextResponse.json({ error: "MFA is already enabled." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const db = await getDb();
  const { ip, userAgent } = await requestMeta();

  const totpStart = totpStartSchema.safeParse(body);
  if (totpStart.success) {
    const totp = newTotp();
    totp.label = session.email;
    const secret = totp.secret.base32;
    await db
      .update(users)
      .set({
        mfaSecretEncrypted: encryptSecret(secret),
        mfaMethod: null,
        mfaSmsCodeHash: null,
        mfaSmsCodeExpiresAt: null,
      })
      .where(eq(users.id, session.id));
    const qr = await totpQrDataUrl(totp.toString());
    return NextResponse.json({ qr, secret });
  }

  const totpConfirm = totpConfirmSchema.safeParse(body);
  if (totpConfirm.success) {
    const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
    if (!user?.mfaSecretEncrypted) {
      return NextResponse.json({ error: "Start authenticator setup again." }, { status: 400 });
    }
    const totp = new TOTP({
      issuer: APP_NAME,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(decryptSecret(user.mfaSecretEncrypted)),
    });
    if (totp.validate({ token: totpConfirm.data.code, window: 1 }) === null) {
      return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
    }
    await db
      .update(users)
      .set({
        mfaEnabledAt: new Date(),
        mfaMethod: "totp",
        mfaSmsCodeHash: null,
        mfaSmsCodeExpiresAt: null,
      })
      .where(eq(users.id, user.id));
    await writeAudit({
      actorUserId: user.id,
      action: "mfa_enabled",
      resourceType: "user",
      resourceId: user.id,
      ip,
      userAgent,
      metadata: { method: "totp" },
    });
    return NextResponse.json({ ok: true, method: "totp" });
  }

  const smsSend = smsSendSchema.safeParse(body);
  if (smsSend.success) {
    const phone = toE164(smsSend.data.phone);
    if (!phone) {
      return NextResponse.json({ error: "Enter a valid US mobile number." }, { status: 400 });
    }
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.mobilePhone, phone))
      .limit(1);
    if (taken && taken.id !== session.id) {
      return NextResponse.json({ error: "That mobile number is already in use." }, { status: 409 });
    }
    await db
      .update(users)
      .set({
        mobilePhone: phone,
        mfaSecretEncrypted: null,
        mfaMethod: null,
      })
      .where(eq(users.id, session.id));
    const issued = await issueSmsMfaCode({ userId: session.id, phone });
    if (!issued.ok) {
      return NextResponse.json({ error: issued.error }, { status: issued.status });
    }
    return NextResponse.json({
      ok: true,
      maskedMobile: maskPhone(phone),
      demoCode: issued.demoCode,
    });
  }

  const smsConfirm = smsConfirmSchema.safeParse(body);
  if (smsConfirm.success) {
    const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
    const phone = smsConfirm.data.phone ? toE164(smsConfirm.data.phone) : user?.mobilePhone;
    if (!phone || !user?.mobilePhone || user.mobilePhone !== phone) {
      return NextResponse.json({ error: "Send an SMS code to your mobile first." }, { status: 400 });
    }
    const verified = await verifySmsMfaCode({ userId: session.id, code: smsConfirm.data.code });
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 401 });
    }
    await db
      .update(users)
      .set({
        mfaEnabledAt: new Date(),
        mfaMethod: "sms",
        mobileVerifiedAt: new Date(),
        mfaSecretEncrypted: null,
        mfaSmsCodeHash: null,
        mfaSmsCodeExpiresAt: null,
      })
      .where(eq(users.id, session.id));
    await writeAudit({
      actorUserId: session.id,
      action: "mfa_enabled",
      resourceType: "user",
      resourceId: session.id,
      ip,
      userAgent,
      metadata: { method: "sms" },
    });
    return NextResponse.json({ ok: true, method: "sms" });
  }

  return NextResponse.json({ error: "Invalid MFA setup request." }, { status: 400 });
}
