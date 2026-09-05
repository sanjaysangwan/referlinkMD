import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { consults, patients, practices, users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/privileges";
import { consultantMatch, listNewConsultsSinceLastLogin } from "@/lib/inbox";

function mapRows(
  rows: Awaited<ReturnType<typeof listNewConsultsSinceLastLogin>>,
) {
  return rows.map((r) => ({
    id: r.consult.id,
    createdAt: r.consult.createdAt,
    status: r.consult.status,
    team: "consulting" as const,
    consultingName: r.consult.consultingName,
    requestedBy: displayName(r.requestedBy.firstName, r.requestedBy.lastName, r.requestedBy.email),
    practiceName: r.practice.name,
    practiceLogo: r.practice.logo,
    patient: {
      firstName: r.patient.firstName,
      lastName: r.patient.lastName,
      dob: r.patient.dob,
      contactPhone: r.patient.contactPhone,
    },
  }));
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const onlyNew = new URL(request.url).searchParams.get("new") === "1";

  if (onlyNew) {
    const rows = await listNewConsultsSinceLastLogin(session.id);
    return NextResponse.json({ consults: mapRows(rows) });
  }

  const db = await getDb();
  const rows = await db
    .select({
      consult: consults,
      patient: patients,
      requestedBy: users,
      practice: practices,
    })
    .from(consults)
    .innerJoin(patients, eq(patients.id, consults.patientId))
    .innerJoin(users, eq(users.id, consults.requestedByUserId))
    .innerJoin(practices, eq(practices.id, consults.requestingPracticeId))
    .where(consultantMatch(session))
    .orderBy(desc(consults.createdAt))
    .limit(100);

  return NextResponse.json({ consults: mapRows(rows) });
}
