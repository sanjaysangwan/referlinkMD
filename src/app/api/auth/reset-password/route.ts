import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { passwordResetTokens, users } from "@/db/schema";
import { getDb } from "@/db";
import { writeAudit } from "@/lib/audit";
import { hashPassword, sha256Hex } from "@/lib/crypto";
import { sendPasswordChangedEmail } from "@/lib/notify";
import { requestMeta } from "@/lib/request";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(10),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a new password with at least 10 characters." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const tokenHash = sha256Hex(parsed.data.token);
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.consumedAt)))
    .limit(1);

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 },
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "This account cannot reset a password." }, { status: 400 });
  }

  // Old password stays valid until this update succeeds.
  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();
  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: false,
      failedLoginCount: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, user.id));
  // Consume the token only after the password hash has been replaced.
  await db
    .update(passwordResetTokens)
    .set({ consumedAt: now })
    .where(eq(passwordResetTokens.id, row.id));
  await db
    .update(passwordResetTokens)
    .set({ consumedAt: now })
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.consumedAt)));

  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: user.id,
    action: "password_reset_completed",
    resourceType: "user",
    resourceId: user.id,
    ip,
    userAgent,
  });

  try {
    await sendPasswordChangedEmail({ toEmail: user.email });
  } catch (err) {
    console.error("password changed confirmation email failed", err);
  }

  return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." });
}
