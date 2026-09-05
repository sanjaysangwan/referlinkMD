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

const confirmSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.mfaEnabled) {
    return NextResponse.json({ alreadyEnabled: true });
  }

  const totp = newTotp();
  totp.label = session.email;
  const secret = totp.secret.base32;
  const db = await getDb();
  await db
    .update(users)
    .set({ mfaSecretEncrypted: encryptSecret(secret) })
    .where(eq(users.id, session.id));
  const qr = await totpQrDataUrl(totp.toString());
  return NextResponse.json({ qr, secret });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit authenticator code." }, { status: 400 });
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!user?.mfaSecretEncrypted) {
    return NextResponse.json({ error: "Start MFA setup again." }, { status: 400 });
  }

  const totp = new TOTP({
    issuer: APP_NAME,
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(decryptSecret(user.mfaSecretEncrypted)),
  });
  if (totp.validate({ token: parsed.data.code, window: 1 }) === null) {
    return NextResponse.json({ error: "Invalid authenticator code." }, { status: 401 });
  }

  await db.update(users).set({ mfaEnabledAt: new Date() }).where(eq(users.id, user.id));
  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: user.id,
    action: "mfa_enabled",
    resourceType: "user",
    resourceId: user.id,
    ip,
    userAgent,
  });
  return NextResponse.json({ ok: true });
}
