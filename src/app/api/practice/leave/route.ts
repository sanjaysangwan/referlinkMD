import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { practiceMemberships } from "@/db/schema";
import { getDb } from "@/db";
import { getSession, loadSessionUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";

/** Leave your current practice. You can still sign in and create a practice or accept an invite. */
export async function POST() {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.practiceId) {
    return NextResponse.json({ error: "You are not on a practice." }, { status: 400 });
  }

  const db = await getDb();
  await db
    .update(practiceMemberships)
    .set({ status: "revoked" })
    .where(
      and(
        eq(practiceMemberships.userId, session.id),
        eq(practiceMemberships.practiceId, session.practiceId),
        eq(practiceMemberships.status, "active"),
      ),
    );

  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: session.id,
    action: "role_changed",
    resourceType: "practice_membership",
    resourceId: session.practiceId,
    ip,
    userAgent,
    metadata: { leftPractice: true },
  });

  const next = await loadSessionUser(session.id);
  return NextResponse.json({
    ok: true,
    practiceId: next?.practiceId ?? null,
    home: "/create-practice",
  });
}
