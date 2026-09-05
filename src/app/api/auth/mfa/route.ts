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

const schema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  const { ip, userAgent } = await requestMeta();
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit authenticator code." }, { status: 400 });
  }

  const userId = await readMfaPendingUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign-in expired. Start again." }, { status: 401 });
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.mfaSecretEncrypted || !user.mfaEnabledAt) {
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
      metadata: { reason: "bad_mfa" },
    });
    return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
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
  });
  return NextResponse.json({ ok: true, home: session ? homePath(session) : "/consults" });
}
