import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { displayName } from "@/lib/privileges";
import { listIncomingConsults, usesPracticeConsultingInbox } from "@/lib/inbox";

function mapRows(rows: Awaited<ReturnType<typeof listIncomingConsults>>) {
  return rows.map((r) => ({
    id: r.consult.id,
    createdAt: r.consult.createdAt,
    status: r.consult.status,
    team: "consulting" as const,
    consultingName: r.consult.consultingName,
    consultingPhone: r.consult.consultingPhone,
    consultingUserId: r.consult.consultingUserId,
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

  const rows = await listIncomingConsults(session, onlyNew);
  const consults = mapRows(rows);

  if (usesPracticeConsultingInbox(session.role)) {
    consults.sort((a, b) => {
      const byName = a.consultingName.localeCompare(b.consultingName, undefined, {
        sensitivity: "base",
      });
      if (byName !== 0) return byName;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return NextResponse.json({
    consults,
    groupByConsultingClinician: usesPracticeConsultingInbox(session.role),
  });
}
