import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { practiceMemberships, users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/privileges";
import type { PracticeRole } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session?.isPracticeCreator || !session.practiceId) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const db = await getDb();
  const rows = await db
    .select({ membership: practiceMemberships, user: users })
    .from(practiceMemberships)
    .innerJoin(users, eq(users.id, practiceMemberships.userId))
    .where(eq(practiceMemberships.practiceId, session.practiceId));

  return NextResponse.json({
    members: rows
      .filter((r) => r.membership.status !== "revoked")
      .map((r) => ({
        id: r.user.id,
        name: `${r.user.firstName} ${r.user.lastName}`.trim() || r.user.email,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        email: r.user.email,
        role: r.membership.role as PracticeRole,
        roleLabel: ROLE_LABEL[r.membership.role as PracticeRole],
        npi: r.user.npi,
        mobilePhone: r.user.mobilePhone,
        status: r.membership.status,
      })),
  });
}
