import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import {
  accessTokens,
  consults,
  favoriteConsultantStars,
  favoriteConsultants,
  invitations,
  passwordResetTokens,
  practiceMemberships,
  users,
} from "@/db/schema";
import { getDb } from "@/db";
import { sha256Hex } from "@/lib/crypto";

const PENDING_EMAIL_SUFFIX = "@referlink.pending";

export function isPendingPlaceholderEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(PENDING_EMAIL_SUFFIX));
}

/** Remove dependent rows, then the invited stub user. No-op if missing or already active. */
export async function deletePlaceholderUser(userId: string): Promise<boolean> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.status !== "invited") return false;

  await db
    .delete(favoriteConsultantStars)
    .where(or(eq(favoriteConsultantStars.consultantUserId, userId), eq(favoriteConsultantStars.userId, userId)));
  await db.delete(favoriteConsultants).where(eq(favoriteConsultants.consultantUserId, userId));
  await db
    .update(favoriteConsultants)
    .set({ addedByUserId: null })
    .where(eq(favoriteConsultants.addedByUserId, userId));
  await db.update(consults).set({ consultingUserId: null }).where(eq(consults.consultingUserId, userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.delete(practiceMemberships).where(eq(practiceMemberships.userId, userId));
  await db.delete(invitations).where(eq(invitations.email, user.email));
  await db.delete(users).where(eq(users.id, userId));
  return true;
}

/**
 * After a practice invite link expires: delete the invited stub account if it was never activated
 * and has no other still-valid invite.
 */
export async function cleanupExpiredPracticeInvitePlaceholder(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  if (!user || user.status !== "invited") return;

  const [openInvite] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.email, normalized),
        isNull(invitations.revokedAt),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (openInvite) return;

  await deletePlaceholderUser(user.id);
}

/**
 * After a consult SMS invite link expires: delete the pending consultant placeholder for that phone
 * if they never signed up and have no other still-valid access token.
 */
export async function cleanupExpiredConsultInvitePlaceholder(consultingPhone: string): Promise<void> {
  const db = await getDb();
  const [openToken] = await db
    .select({ id: accessTokens.id })
    .from(accessTokens)
    .where(and(eq(accessTokens.consultingPhone, consultingPhone), gt(accessTokens.expiresAt, new Date())))
    .limit(1);
  if (openToken) return;

  const [stub] = await db
    .select()
    .from(users)
    .where(and(eq(users.mobilePhone, consultingPhone), eq(users.status, "invited")))
    .limit(1);
  if (!stub || !isPendingPlaceholderEmail(stub.email)) return;

  await deletePlaceholderUser(stub.id);
}

/** Best-effort: if this raw invite token is expired, clean up its placeholder user. */
export async function cleanupIfExpiredPracticeInviteToken(rawToken: string): Promise<void> {
  const db = await getDb();
  const [invite] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, sha256Hex(rawToken)))
    .limit(1);
  if (!invite) return;
  if (invite.acceptedAt) return;
  if (!invite.revokedAt && invite.expiresAt.getTime() >= Date.now()) return;
  await cleanupExpiredPracticeInvitePlaceholder(invite.email);
}

/** Best-effort: if this consult access token is expired, clean up its placeholder consultant. */
export async function cleanupIfExpiredConsultInviteToken(rawToken: string): Promise<void> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(accessTokens)
    .where(eq(accessTokens.tokenHash, sha256Hex(rawToken)))
    .limit(1);
  if (!row || row.expiresAt.getTime() >= Date.now()) return;
  await cleanupExpiredConsultInvitePlaceholder(row.consultingPhone);
}

/** Sweep expired invites that still point at unused placeholders (safe to call opportunistically). */
export async function sweepExpiredInvitePlaceholders(): Promise<void> {
  const db = await getDb();
  const now = new Date();

  const expiredPractice = await db
    .select({ email: invitations.email })
    .from(invitations)
    .where(and(isNull(invitations.acceptedAt), isNull(invitations.revokedAt), lt(invitations.expiresAt, now)));

  for (const email of new Set(expiredPractice.map((r) => r.email))) {
    await cleanupExpiredPracticeInvitePlaceholder(email);
  }

  const expiredConsult = await db
    .select({ phone: accessTokens.consultingPhone })
    .from(accessTokens)
    .where(lt(accessTokens.expiresAt, now));

  for (const phone of new Set(expiredConsult.map((r) => r.phone))) {
    await cleanupExpiredConsultInvitePlaceholder(phone);
  }
}
