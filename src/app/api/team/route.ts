import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { practiceMemberships, users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/privileges";
import { resolveSpecialtyLabel } from "@/lib/specialty";
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

  const members = await Promise.all(
    rows
      .filter((r) => r.membership.status !== "revoked")
      .map(async (r) => {
        const role = r.membership.role as PracticeRole;
        const specialty =
          role === "physician"
            ? await resolveSpecialtyLabel(db, r.user.specialtyId, r.user.subspecialtyId)
            : {
                specialtyName: null,
                subspecialtyName: null,
                specialtyLabel: null,
              };
        return {
          id: r.user.id,
          name: `${r.user.firstName} ${r.user.lastName}`.trim() || r.user.email,
          firstName: r.user.firstName,
          lastName: r.user.lastName,
          email: r.user.email,
          role,
          roleLabel: ROLE_LABEL[role],
          npi: r.user.npi,
          mobilePhone: r.user.mobilePhone,
          status: r.membership.status,
          specialtyId: role === "physician" ? r.user.specialtyId : null,
          subspecialtyId: role === "physician" ? r.user.subspecialtyId : null,
          specialtyName: specialty.specialtyName,
          subspecialtyName: specialty.subspecialtyName,
          specialtyLabel: specialty.specialtyLabel,
        };
      }),
  );

  return NextResponse.json({ members });
}
