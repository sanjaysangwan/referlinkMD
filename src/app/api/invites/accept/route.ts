import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, isNull, ne } from "drizzle-orm";
import { invitations, practiceMemberships, practices, users } from "@/db/schema";
import { getDb } from "@/db";
import { createSession, homePath, loadSessionUser } from "@/lib/auth";
import { hashPassword, sha256Hex } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";

const schema = z.object({
  token: z.string().min(16),
  password: z.string().min(10).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite acceptance." }, { status: 400 });
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

  const needsPassword = user.status === "invited" || user.mustChangePassword;
  if (needsPassword) {
    if (!parsed.data.password || parsed.data.password.length < 10) {
      return NextResponse.json({ error: "Choose a password of at least 10 characters." }, { status: 400 });
    }
  }

  const now = new Date();

  // Leave any other active practice when joining this one.
  await db
    .update(practiceMemberships)
    .set({ status: "revoked" })
    .where(
      and(
        eq(practiceMemberships.userId, user.id),
        eq(practiceMemberships.status, "active"),
        ne(practiceMemberships.practiceId, invite.practiceId),
      ),
    );

  const userPatch: {
    firstName?: string;
    lastName?: string;
    passwordHash?: string;
    mustChangePassword: boolean;
    status: "active";
  } = {
    mustChangePassword: false,
    status: "active",
  };
  if (parsed.data.firstName?.trim()) userPatch.firstName = parsed.data.firstName.trim();
  if (parsed.data.lastName?.trim()) userPatch.lastName = parsed.data.lastName.trim();
  if (needsPassword && parsed.data.password) {
    userPatch.passwordHash = await hashPassword(parsed.data.password);
  }
  await db.update(users).set(userPatch).where(eq(users.id, user.id));

  const [membership] = await db
    .select()
    .from(practiceMemberships)
    .where(
      and(eq(practiceMemberships.userId, user.id), eq(practiceMemberships.practiceId, invite.practiceId)),
    )
    .limit(1);

  if (membership) {
    await db
      .update(practiceMemberships)
      .set({ status: "active", acceptedAt: now, role: invite.role })
      .where(eq(practiceMemberships.id, membership.id));
  } else {
    await db.insert(practiceMemberships).values({
      id: crypto.randomUUID(),
      practiceId: invite.practiceId,
      userId: user.id,
      role: invite.role,
      status: "active",
      invitedByUserId: invite.invitedByUserId,
      acceptedAt: now,
    });
  }

  await db.update(invitations).set({ acceptedAt: now }).where(eq(invitations.id, invite.id));

  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: user.id,
    action: "account_created",
    resourceType: "invitation",
    resourceId: invite.id,
    ip,
    userAgent,
    metadata: { moved: true },
  });
  await createSession(user.id);
  const session = await loadSessionUser(user.id);
  return NextResponse.json({ ok: true, home: session ? homePath(session) : "/mfa/setup" });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (token.length < 16) {
    return NextResponse.json({ error: "Invalid invite." }, { status: 400 });
  }
  const db = await getDb();
  const [invite] = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.tokenHash, sha256Hex(token)), isNull(invitations.revokedAt)))
    .limit(1);
  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This invite is invalid or expired." }, { status: 400 });
  }
  const [practice] = await db.select().from(practices).where(eq(practices.id, invite.practiceId)).limit(1);
  const [user] = await db.select().from(users).where(eq(users.email, invite.email)).limit(1);
  const [activeElsewhere] = user
    ? await db
        .select({ practiceId: practiceMemberships.practiceId })
        .from(practiceMemberships)
        .where(
          and(
            eq(practiceMemberships.userId, user.id),
            eq(practiceMemberships.status, "active"),
            ne(practiceMemberships.practiceId, invite.practiceId),
          ),
        )
        .limit(1)
    : [];
  let currentPracticeName: string | null = null;
  if (activeElsewhere) {
    const [current] = await db
      .select({ name: practices.name })
      .from(practices)
      .where(eq(practices.id, activeElsewhere.practiceId))
      .limit(1);
    currentPracticeName = current?.name ?? null;
  }
  const needsPassword = !user || user.status === "invited" || user.mustChangePassword;
  return NextResponse.json({
    email: invite.email,
    practiceName: practice?.name ?? "a practice",
    role: invite.role,
    needsPassword,
    currentPracticeName,
  });
}
