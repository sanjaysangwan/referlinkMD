import { and, count, desc, eq, isNull, or, sql, type SQL } from "drizzle-orm";
import { consults, patients, practices, users } from "@/db/schema";
import { getDb } from "@/db";


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

function awaitingFilters(user: {
  id: string;
  mobilePhone: string | null;
  npi: string | null;
  firstName: string;
  lastName: string;
}): SQL | undefined {
  return and(consultantMatch(user), isNull(consults.resolution));
}

export async function countNewConsultsSinceLastLogin(userId: string): Promise<number> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return 0;
  const [row] = await db.select({ n: count() }).from(consults).where(awaitingFilters(user));
  return Number(row?.n ?? 0);
}

export async function listNewConsultsSinceLastLogin(userId: string) {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return [];
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
    .where(awaitingFilters(user))
    .orderBy(desc(consults.createdAt))
    .limit(100);
}
