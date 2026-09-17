import { NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { users, practiceMemberships, practices } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/privileges";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.practiceId) {
    return NextResponse.json({ error: "Join a practice to search consultants." }, { status: 400 });
  }
  if (!can(session.role, "createConsult") && !can(session.role, "manageUsers")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) return NextResponse.json({ consultants: [] });

  const db = await getDb();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  try {
    const matches = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        mobilePhone: users.mobilePhone,
        npi: users.npi,
        specialtyId: users.specialtyId,
        subspecialtyId: users.subspecialtyId,
      })
      .from(users)
      .where(
        and(
          eq(users.status, "active"),
          sql`(
            exists (
              select 1 from ${practiceMemberships}
              where ${practiceMemberships.userId} = ${users.id}
                and ${practiceMemberships.status} = 'active'
                and ${practiceMemberships.role} in ('physician', 'app')
            )
            or (
              ${users.npi} is not null
              and not exists (
                select 1 from ${practiceMemberships}
                where ${practiceMemberships.userId} = ${users.id}
              )
            )
          )`,
          ...words.map(
            (word) => sql`position(${word} in lower(${users.firstName} || ' ' || ${users.lastName})) > 0`,
          ),
        ),
      )
      .orderBy(users.lastName, users.firstName)
      .limit(10);

    const officeByUser = new Map<string, string | null>();
    if (matches.length) {
      const memberships = await db
        .select({
          userId: practiceMemberships.userId,
          officePhone: practices.phone,
          createdAt: practiceMemberships.createdAt,
        })
        .from(practiceMemberships)
        .innerJoin(practices, eq(practices.id, practiceMemberships.practiceId))
        .where(
          and(
            inArray(
              practiceMemberships.userId,
              matches.map((m) => m.id),
            ),
            eq(practiceMemberships.status, "active"),
          ),
        )
        .orderBy(desc(practiceMemberships.createdAt));

      for (const row of memberships) {
        if (!officeByUser.has(row.userId)) {
          officeByUser.set(row.userId, row.officePhone);
        }
      }
    }

    const consultants = matches.map((m) => ({
      ...m,
      officePhone: officeByUser.get(m.id) ?? null,
    }));

    return NextResponse.json({ consultants }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("consultants search failed", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
