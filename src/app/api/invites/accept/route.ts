import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { invitations, practiceMemberships, users } from "@/db/schema";
import { getDb } from "@/db";
import { createSession, homePath, loadSessionUser } from "@/lib/auth";
import { hashPassword, sha256Hex } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";

const schema = z.object({
  token: z.string().min(16),
  password: z.string().min(10),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a password of at least 10 characters." }, { status: 400 });
  }

  const db = await getDb();
  const [invite] = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.tokenHash, sha256Hex(parsed.data.token)), isNull(invitations.revokedAt)))
    .limit(1);

  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This invite is invalid or expired." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, invite.email)).limit(1);
  if (!user) return NextResponse.json({ error: "Invite account is missing." }, { status: 400 });

  const now = new Date();
  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName?.trim() || user.firstName,
      lastName: parsed.data.lastName?.trim() || user.lastName,
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
      status: "active",
    })
    .where(eq(users.id, user.id));

  await db
    .update(practiceMemberships)
    .set({ status: "active", acceptedAt: now })
    .where(and(eq(practiceMemberships.userId, user.id), eq(practiceMemberships.practiceId, invite.practiceId)));

  await db.update(invitations).set({ acceptedAt: now }).where(eq(invitations.id, invite.id));

  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: user.id,
    action: "account_created",
    resourceType: "invitation",
    resourceId: invite.id,
    ip,
    userAgent,
  });
  await createSession(user.id);
  const session = await loadSessionUser(user.id);
  return NextResponse.json({ ok: true, home: session ? homePath(session) : "/mfa/setup" });
}
