import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { passwordResetTokens, users } from "@/db/schema";
import { getDb } from "@/db";
import { writeAudit } from "@/lib/audit";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { PASSWORD_RESET_TTL_MS } from "@/lib/env";
import { sendPasswordResetEmail } from "@/lib/notify";
import { requestMeta } from "@/lib/request";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const db = await getDb();
  const { ip, userAgent } = await requestMeta();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || user.status !== "active") {
    await writeAudit({
      action: "password_reset_requested",
      resourceType: "user",
      resourceId: email,
      ip,
      userAgent,
      metadata: { found: false },
    });
    return NextResponse.json(
      {
        error: `This email is not registered. Please use Create Login to create a login with ${email}.`,
        email,
        registered: false,
      },
      { status: 404 },
    );
  }

  await db
    .update(passwordResetTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.consumedAt)));

  const rawToken = randomToken();
  await db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash: sha256Hex(rawToken),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });

  try {
    await sendPasswordResetEmail({ toEmail: user.email, rawToken });
    await writeAudit({
      actorUserId: user.id,
      action: "password_reset_requested",
      resourceType: "user",
      resourceId: user.id,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("password reset email failed", err);
    return NextResponse.json(
      { error: "Could not send the reset email. Try again in a moment." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    registered: true,
    message: "We sent a password reset link. Check your inbox (and Demo inbox in demo mode).",
  });
}
