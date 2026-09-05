import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { consults, patients, practices, users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { can, displayName } from "@/lib/privileges";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import { accessTokens } from "@/db/schema";
import { and, isNull } from "drizzle-orm";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const db = await getDb();
  const [row] = await db
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
    .where(eq(consults.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isPrimary = session.practiceId === row.consult.requestingPracticeId;
  const isConsulting =
    row.consult.consultingUserId === session.id ||
    (session.mobilePhone !== null && row.consult.consultingPhone === session.mobilePhone) ||
    (session.firstName.trim().length > 0 &&
      session.lastName.trim().length > 0 &&
      row.consult.consultingName.toLowerCase().includes(session.firstName.trim().toLowerCase()) &&
      row.consult.consultingName.toLowerCase().includes(session.lastName.trim().toLowerCase()));

  if (!isPrimary && !isConsulting) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const showPatient =
    isConsulting || (isPrimary && can(session.role, "viewPatientIdentifiers"));

  const markViewed = isConsulting && row.consult.resolution === null && ["pending_consultant", "awaiting_view"].includes(row.consult.status);
  if (markViewed) {
    await db
      .update(consults)
      .set({ status: "viewed", firstViewedAt: row.consult.firstViewedAt ?? new Date(), updatedAt: new Date() })
      .where(eq(consults.id, id));
    await db
      .update(accessTokens)
      .set({ consumedAt: new Date() })
      .where(and(eq(accessTokens.consultId, id), isNull(accessTokens.consumedAt)));
    const { ip, userAgent } = await requestMeta();
    await writeAudit({
      actorUserId: session.id,
      action: "consult_viewed",
      resourceType: "consult",
      resourceId: id,
      ip,
      userAgent,
    });
    await writeAudit({
      actorUserId: session.id,
      action: "patient_viewed",
      resourceType: "patient",
      resourceId: row.patient.id,
      ip,
      userAgent,
    });
  }

  return NextResponse.json({
    id: row.consult.id,
    status: markViewed ? "viewed" : row.consult.status,
    createdAt: row.consult.createdAt,
    team: isConsulting ? "consulting" : "primary",
    primaryTeam: {
      practiceName: row.practice.name,
      logo: row.practice.logo,
      clinician: displayName(row.requestedBy.firstName, row.requestedBy.lastName, row.requestedBy.email),
      npi: row.requestedBy.npi,
      phone: row.practice.phone,
      fax: row.practice.fax,
    },
    consultingTeam: {
      name: row.consult.consultingName,
      phone: row.consult.consultingPhone,
    },
    patient: showPatient
      ? {
          firstName: row.patient.firstName,
          lastName: row.patient.lastName,
          dob: row.patient.dob,
          contactPhone: row.patient.contactPhone,
          isSynthetic: row.patient.isSynthetic,
        }
      : {
          firstName: row.patient.firstName,
          lastName: `${row.patient.lastName.slice(0, 1)}.`,
          dob: null,
          contactPhone: null,
          isSynthetic: row.patient.isSynthetic,
        },
  });
}
