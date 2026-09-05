import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { consults, patients, practices, users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/privileges";
import { toE164 } from "@/lib/phone";
import { findConsultingClinician, upsertPatient } from "@/lib/clinician";
import { randomToken, sha256Hex } from "@/lib/crypto";
import { sendConsultSms } from "@/lib/notify";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import { accessTokens } from "@/db/schema";
import { displayName } from "@/lib/privileges";

const createSchema = z.object({
  patientFirstName: z.string().min(1),
  patientLastName: z.string().min(1),
  patientDob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  patientPhone: z.string().min(10),
  consultingName: z.string().min(2),
  consultingPhone: z.string().min(10),
  consultPriority: z.enum(["immediate", "urgent", "routine"]).default("routine"),
  consultRequestComment: z.string().trim().max(2000).optional(),
});

function redactPatient(
  patient: { firstName: string; lastName: string; dob: string; contactPhone: string },
  showIdentifiers: boolean,
) {
  if (showIdentifiers) return patient;
  return {
    firstName: patient.firstName,
    lastName: `${patient.lastName.slice(0, 1)}.`,
    dob: null,
    contactPhone: null,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDb();

  if (session.practiceId && can(session.role, "viewPracticeQueue")) {
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
      .where(eq(consults.requestingPracticeId, session.practiceId))
      .orderBy(desc(consults.createdAt))
      .limit(100);

    const show = can(session.role, "viewPatientIdentifiers");
    return NextResponse.json({
      consults: rows.map((r) => ({
        id: r.consult.id,
        createdAt: r.consult.createdAt,
        status: r.consult.status,
        team: "primary",
        consultingName: r.consult.consultingName,
        consultingPhone: r.consult.consultingPhone,
        requestedBy: displayName(r.requestedBy.firstName, r.requestedBy.lastName, r.requestedBy.email),
        practiceName: r.practice.name,
        practiceLogo: r.practice.logo,
        patient: redactPatient(r.patient, show),
      })),
    });
  }

  return NextResponse.json({ consults: [] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.practiceId || !can(session.role, "createConsult")) {
    return NextResponse.json({ error: "Not allowed to request a consult." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter patient identifiers and the consulting clinician phone." }, { status: 400 });
  }

  const patientPhone = toE164(parsed.data.patientPhone);
  const consultingPhone = toE164(parsed.data.consultingPhone);
  if (!patientPhone || !consultingPhone) {
    return NextResponse.json({ error: "Use valid US phone numbers." }, { status: 400 });
  }

  const patient = await upsertPatient({
    practiceId: session.practiceId,
    createdByUserId: session.id,
    firstName: parsed.data.patientFirstName.trim(),
    lastName: parsed.data.patientLastName.trim(),
    dob: parsed.data.patientDob,
    contactPhone: patientPhone,
  });

  const existingConsultant = await findConsultingClinician({
    phone: consultingPhone,
    name: parsed.data.consultingName,
  });
  const deliverTo = existingConsultant?.mobilePhone || consultingPhone;
  const consultId = crypto.randomUUID();
  const now = new Date();
  const db = await getDb();
  await db.insert(consults).values({
    id: consultId,
    requestingPracticeId: session.practiceId,
    requestedByUserId: session.id,
    patientId: patient.id,
    consultingName: parsed.data.consultingName.trim(),
    consultingPhone: deliverTo,
    consultingUserId: existingConsultant?.id ?? null,
    consultPriority: parsed.data.consultPriority,
    consultRequestComment: parsed.data.consultRequestComment || null,
    status: existingConsultant ? "awaiting_view" : "pending_consultant",
    createdAt: now,
    updatedAt: now,
  });

  const rawToken = randomToken();
  await db.insert(accessTokens).values({
    id: crypto.randomUUID(),
    consultId,
    consultingPhone: deliverTo,
    tokenHash: sha256Hex(rawToken),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  });

  const { ip, userAgent } = await requestMeta();
  await sendConsultSms({
    consultId,
    rawToken,
    consultingPhone: deliverTo,
    requestingClinicianName: displayName(
      session.firstName,
      session.lastName,
      session.practiceName ?? session.email,
    ),
    actorUserId: session.id,
    ip,
    userAgent,
  });
  await writeAudit({
    actorUserId: session.id,
    action: "consult_created",
    resourceType: "consult",
    resourceId: consultId,
    ip,
    userAgent,
    metadata: { hasExistingAccount: Boolean(existingConsultant) },
  });

  return NextResponse.json({ ok: true, id: consultId });
}
