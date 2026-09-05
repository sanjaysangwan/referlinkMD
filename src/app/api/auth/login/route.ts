import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Secret, TOTP } from "otpauth";
import { users } from "@/db/schema";
import { getDb } from "@/db";
import { clearSession, createMfaPending, createSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { decryptSecret, verifyPassword } from "@/lib/crypto";
import { requestMeta } from "@/lib/request";
import { isDemo } from "@/lib/env";
import { APP_NAME } from "@/lib/brand";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LOCKOUT_AFTER = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  const { ip, userAgent } = await requestMeta();
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials payload." }, { status: 400 });
  }

  const db = await getDb();
  const email = parsed.data.email.toLowerCase().trim();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || user.status === "disabled") {
    await writeAudit({
      action: "login_failure",
      resourceType: "user",
      resourceId: email,
      ip,
      userAgent,
      metadata: { reason: "unknown_user" },
    });
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  if (user.status === "invited") {
    return NextResponse.json(
      { error: "Open the invite email and create a password first." },
      { status: 403 },
    );
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await writeAudit({
      actorUserId: user.id,
      action: "login_failure",
      resourceType: "user",
      resourceId: user.id,
      ip,
      userAgent,
      metadata: { reason: "locked" },
    });
    return NextResponse.json({ error: "Account is temporarily locked. Try again later." }, { status: 423 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    const fails = user.failedLoginCount + 1;
    await db
      .update(users)
      .set({
        failedLoginCount: fails,
        lockedUntil: fails >= LOCKOUT_AFTER ? new Date(Date.now() + LOCKOUT_MS) : user.lockedUntil,
      })
      .where(eq(users.id, user.id));
    await writeAudit({
      actorUserId: user.id,
      action: "login_failure",
      resourceType: "user",
      resourceId: user.id,
      ip,
      userAgent,
      metadata: { reason: "bad_password" },
    });
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  await db
    .update(users)
    .set({
      failedLoginCount: 0,
      lockedUntil: null,
      previousLoginAt: user.lastLoginAt,
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, user.id));

  if (user.mustChangePassword) {
    await createSession(user.id);
    return NextResponse.json({ ok: true, home: "/password", mustChangePassword: true });
  }

  if (!user.mfaEnabledAt) {
    await createSession(user.id);
    return NextResponse.json({ ok: true, home: "/mfa/setup", mustEnrollMfa: true });
  }

  await clearSession();
  await createMfaPending(user.id);
  let demoCode: string | undefined;
  if (isDemo() && user.mfaSecretEncrypted) {
    const totp = new TOTP({
      issuer: APP_NAME,
      label: user.email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(decryptSecret(user.mfaSecretEncrypted)),
    });
    demoCode = totp.generate();
  }
  return NextResponse.json({ ok: true, mfaRequired: true, demoCode });
}

