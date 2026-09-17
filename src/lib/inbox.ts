import { and, count, desc, eq, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { consults, patients, practiceMemberships, practices, users } from "@/db/schema";
import { getDb } from "@/db";
import type { PracticeRole, SessionUser } from "@/lib/types";

function likeContains(value: string): string {
  return `%${value.replace(/[%_\\]/g, "").toLowerCase()}%`;
}

export function consultantMatch(user: {
  id: string;
  mobilePhone: string | null;
  npi?: string | null;
  firstName?: string;
  lastName?: string;
}): SQL {
  const parts: SQL[] = [eq(consults.consultingUserId, user.id)];
  if (user.mobilePhone) parts.push(eq(consults.consultingPhone, user.mobilePhone));
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) {
    parts.push(
      and(
        sql`lower(${consults.consultingName}) like ${likeContains(first)}`,
        sql`lower(${consults.consultingName}) like ${likeContains(last)}`,
      )!,
    );
  }
  return or(...parts)!;
}

export function usesPracticeConsultingInbox(role: PracticeRole | null | undefined): boolean {
  return role === "app" || role === "office_manager";
}

export async function practiceConsultantMatch(practiceId: string): Promise<SQL | null> {
  const db = await getDb();
  const clinicians = await db
    .select({
      id: users.id,
      mobilePhone: users.mobilePhone,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(practiceMemberships)
    .innerJoin(users, eq(users.id, practiceMemberships.userId))
    .where(
      and(
        eq(practiceMemberships.practiceId, practiceId),
        eq(practiceMemberships.status, "active"),
        inArray(practiceMemberships.role, ["physician", "app"]),
      ),
    );

  if (!clinicians.length) return null;
  return or(...clinicians.map((c) => consultantMatch(c)))!;
}

export async function incomingConsultFilter(session: SessionUser): Promise<SQL | null> {
  if (usesPracticeConsultingInbox(session.role)) {
    if (!session.practiceId) return null;
    return practiceConsultantMatch(session.practiceId);
  }
  return consultantMatch(session);
}

export async function isConsultingAccess(
  session: SessionUser,
  consult: {
    consultingUserId: string | null;
    consultingPhone: string;
    consultingName: string;
  },
): Promise<boolean> {
  if (consult.consultingUserId === session.id) return true;
  if (session.mobilePhone && consult.consultingPhone === session.mobilePhone) return true;
  const first = session.firstName?.trim();
  const last = session.lastName?.trim();
  if (
    first &&
    last &&
    consult.consultingName.toLowerCase().includes(first.toLowerCase()) &&
    consult.consultingName.toLowerCase().includes(last.toLowerCase())
  ) {
    return true;
  }

  if (!usesPracticeConsultingInbox(session.role) || !session.practiceId) return false;

  const db = await getDb();
  const clinicians = await db
    .select({
      id: users.id,
      mobilePhone: users.mobilePhone,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(practiceMemberships)
    .innerJoin(users, eq(users.id, practiceMemberships.userId))
    .where(
      and(
        eq(practiceMemberships.practiceId, session.practiceId),
        eq(practiceMemberships.status, "active"),
        inArray(practiceMemberships.role, ["physician", "app"]),
      ),
    );

  return clinicians.some((c) => {
    if (consult.consultingUserId && consult.consultingUserId === c.id) return true;
    if (c.mobilePhone && consult.consultingPhone === c.mobilePhone) return true;
    const cf = c.firstName.trim();
    const cl = c.lastName.trim();
    return Boolean(
      cf &&
        cl &&
        consult.consultingName.toLowerCase().includes(cf.toLowerCase()) &&
        consult.consultingName.toLowerCase().includes(cl.toLowerCase()),
    );
  });
}

function awaitingFilters(match: SQL): SQL {
  return and(match, isNull(consults.resolution))!;
}

export async function countNewConsultsForSession(session: SessionUser): Promise<number> {
  const match = await incomingConsultFilter(session);
  if (!match) return 0;
  const db = await getDb();
  const [row] = await db.select({ n: count() }).from(consults).where(awaitingFilters(match));
  return Number(row?.n ?? 0);
}

/** @deprecated prefer countNewConsultsForSession */
export async function countNewConsultsSinceLastLogin(userId: string): Promise<number> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return 0;
  const [membership] = await db
    .select()
    .from(practiceMemberships)
    .where(and(eq(practiceMemberships.userId, userId), eq(practiceMemberships.status, "active")))
    .limit(1);
  const sessionLike: SessionUser = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    npi: user.npi,
    mobilePhone: user.mobilePhone,
    healthSystemId: null,
    healthSystemName: null,
    practiceId: membership?.practiceId ?? null,
    practiceName: null,
    practiceLogo: null,
    role: (membership?.role as PracticeRole | undefined) ?? null,
    isPracticeCreator: false,
    mustChangePassword: user.mustChangePassword,
    mfaEnabled: Boolean(user.mfaEnabledAt),
    specialtyId: user.specialtyId ?? null,
    subspecialtyId: user.subspecialtyId ?? null,
    specialtyName: null,
    subspecialtyName: null,
    specialtyLabel: null,
  };
  return countNewConsultsForSession(sessionLike);
}

export async function listIncomingConsults(session: SessionUser, onlyUnresolved = false) {
  const match = await incomingConsultFilter(session);
  if (!match) return [];
  const db = await getDb();
  const where = onlyUnresolved ? awaitingFilters(match) : match;
  return db
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
    .where(where)
    .orderBy(desc(consults.createdAt))
    .limit(100);
}

/** @deprecated prefer listIncomingConsults */
export async function listNewConsultsSinceLastLogin(userId: string) {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return [];
  const [membership] = await db
    .select()
    .from(practiceMemberships)
    .where(and(eq(practiceMemberships.userId, userId), eq(practiceMemberships.status, "active")))
    .limit(1);
  return listIncomingConsults(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      npi: user.npi,
      mobilePhone: user.mobilePhone,
      healthSystemId: null,
      healthSystemName: null,
      practiceId: membership?.practiceId ?? null,
      practiceName: null,
      practiceLogo: null,
      role: (membership?.role as PracticeRole | undefined) ?? null,
      isPracticeCreator: false,
      mustChangePassword: user.mustChangePassword,
      mfaEnabled: Boolean(user.mfaEnabledAt),
      specialtyId: user.specialtyId ?? null,
      subspecialtyId: user.subspecialtyId ?? null,
      specialtyName: null,
      subspecialtyName: null,
      specialtyLabel: null,
    },
    true,
  );
}
