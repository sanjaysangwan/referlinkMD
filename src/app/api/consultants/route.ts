import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { users, practiceMemberships, practices } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/privileges";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.practiceId || !session.mfaEnabled || session.mustChangePassword || !can(session.role, "createConsult")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) return NextResponse.json({ consultants: [] });
  const db = await getDb();
  const words = query.toLowerCase().split(/\s+/);
  const consultants = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      mobilePhone: users.mobilePhone,
      npi: users.npi,
      officePhone: sql<string | null>`(
        select ${practices.phone}
        from ${practiceMemberships}
        inner join ${practices} on ${practices.id} = ${practiceMemberships.practiceId}
        where ${practiceMemberships.userId} = ${users.id}
          and ${practiceMemberships.status} = 'active'
        order by ${practiceMemberships.createdAt} desc
        limit 1
      )`,
    })
    .from(users)
    .where(
      and(
        eq(users.status, "active"),
        sql`(exists (select 1 from ${practiceMemberships} where ${practiceMemberships.userId} = ${users.id} and ${practiceMemberships.status} = 'active' and ${practiceMemberships.role} in ('physician', 'app')) or (${users.npi} is not null and not exists (select 1 from ${practiceMemberships} where ${practiceMemberships.userId} = ${users.id})))`,
        ...words.map(
          (word) => sql`position(${word} in lower(${users.firstName} || ' ' || ${users.lastName})) > 0`,
        ),
      ),
    )
    .orderBy(users.lastName, users.firstName)
    .limit(10);
  return NextResponse.json({ consultants }, { headers: { "Cache-Control": "no-store" } });
}
