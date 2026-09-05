import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { invitations, practiceMemberships, users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/privileges";
import { hashPassword, randomToken, sha256Hex } from "@/lib/crypto";
import { sendInviteEmail } from "@/lib/notify";
import { APP_NAME } from "@/lib/brand";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import type { PracticeRole } from "@/lib/types";

const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(["physician", "app", "office_manager"]),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.isPracticeCreator || !session.practiceId) {
    return NextResponse.json({ error: "Not allowed to invite users." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const db = await getDb();
  const rawToken = randomToken();
  const inviteId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const lockedHash = await hashPassword(randomToken());

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const targetUserId = existing?.id ?? userId;

  if (!existing) {
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash: lockedHash,
      firstName: "",
      lastName: "",
      mustChangePassword: true,
      status: "invited",
    });
  } else if (existing.status !== "disabled") {
    await db
      .update(users)
      .set({
        mustChangePassword: true,
        status: existing.status === "active" ? "active" : "invited",
      })
      .where(eq(users.id, existing.id));
  } else {
    return NextResponse.json({ error: "That account is disabled." }, { status: 400 });
  }

  await db.insert(invitations).values({
    id: inviteId,
    practiceId: session.practiceId,
    email,
    role: parsed.data.role,
    tokenHash: sha256Hex(rawToken),
    tempPasswordHash: null,
    expiresAt: expires,
    invitedByUserId: session.id,
  });

  const [membership] = await db
    .select()
    .from(practiceMemberships)
    .where(
      and(
        eq(practiceMemberships.practiceId, session.practiceId),
        eq(practiceMemberships.userId, targetUserId),
      ),
    )
    .limit(1);
  if (!membership) {
    await db.insert(practiceMemberships).values({
      id: crypto.randomUUID(),
      practiceId: session.practiceId,
      userId: targetUserId,
      role: parsed.data.role,
      status: "invited",
      invitedByUserId: session.id,
    });
  }

  await sendInviteEmail({
    toEmail: email,
    practiceName: session.practiceName ?? `a ${APP_NAME} practice`,
    rawToken,
    role: ROLE_LABEL[parsed.data.role as PracticeRole],
  });

  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: session.id,
    action: "invite_sent",
    resourceType: "invitation",
    resourceId: inviteId,
    ip,
    userAgent,
    metadata: { role: parsed.data.role },
  });

  return NextResponse.json({ ok: true });
}
