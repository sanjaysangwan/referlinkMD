import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { TOTP, Secret } from "otpauth";
import { users } from "@/db/schema";
import { getDb } from "@/db";
import { createSession, loadSessionUser, readMfaPendingUserId, homePath } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import { APP_NAME } from "@/lib/brand";
import { issueSmsMfaCode, maskPhone, resolveMfaMethod, verifySmsMfaCode } from "@/lib/mfa";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { ip, userAgent } = await requestMeta();

  const userId = await readMfaPendingUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign-in expired. Start again." }, { status: 401 });
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.mfaEnabledAt) {
    return NextResponse.json({ error: "MFA is not enabled for this account." }, { status: 400 });
  }

  const mfaMethod = resolveMfaMethod(user);

  if (body && typeof body === "object" && (body as { resend?: unknown }).resend === true && !("code" in (body as object))) {
    if (mfaMethod !== "sms" || !user.mobilePhone) {
      return NextResponse.json({ error: "SMS resend is not available for this account." }, { status: 400 });
    }
    const issued = await issueSmsMfaCode({ userId: user.id, phone: user.mobilePhone });
    if (!issued.ok) {
      return NextResponse.json({ error: issued.error }, { status: issued.status });
    }
    return NextResponse.json({
      ok: true,
      mfaMethod: "sms",
      demoCode: issued.demoCode,
      maskedMobile: maskPhone(user.mobilePhone),
    });
  }

  const parsed = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: mfaMethod === "sms" ? "Enter the 6-digit SMS code." : "Enter the 6-digit authenticator code." },
      { status: 400 },
    );
  }

  if (mfaMethod === "sms") {
    const verified = await verifySmsMfaCode({ userId: user.id, code: parsed.data.code });
    if (!verified.ok) {
      await writeAudit({
        actorUserId: user.id,
        action: "login_failure",
        resourceType: "user",
        resourceId: user.id,
        ip,
        userAgent,
        metadata: { reason: "bad_mfa", method: "sms" },
      });
      return NextResponse.json({ error: verified.error }, { status: 401 });
    }
  } else {
    if (!user.mfaSecretEncrypted) {
      return NextResponse.json({ error: "MFA is not enabled for this account." }, { status: 400 });
    }
    const totp = new TOTP({
      issuer: APP_NAME,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(decryptSecret(user.mfaSecretEncrypted)),
    });
    const delta = totp.validate({ token: parsed.data.code, window: 1 });
    if (delta === null) {
      await writeAudit({
        actorUserId: user.id,
        action: "login_failure",
        resourceType: "user",
        resourceId: user.id,
        ip,
        userAgent,
        metadata: { reason: "bad_mfa", method: "totp" },
      });
      return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
    }
  }

  await createSession(user.id);
  const session = await loadSessionUser(user.id);
  await writeAudit({
    actorUserId: user.id,
    action: "login_success",
    resourceType: "user",
    resourceId: user.id,
    ip,
    userAgent,
    metadata: { method: mfaMethod },
  });
  return NextResponse.json({ ok: true, home: session ? homePath(session) : "/consults" });
}
