import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { practiceMemberships, practices, users } from "@/db/schema";
import { getDb } from "@/db";
import { formatZipDisplay, practiceNameZipKey } from "@/lib/practice-identity";

type AdminContact = {
  name: string;
  email: string;
  phone: string | null;
};

function displayName(firstName: string, lastName: string, email: string) {
  const full = `${firstName} ${lastName}`.trim();
  return full || email;
}

async function adminForPractice(
  db: Awaited<ReturnType<typeof getDb>>,
  practiceId: string,
  createdByUserId: string,
  practicePhone: string,
): Promise<AdminContact | null> {
  const members = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      mobilePhone: users.mobilePhone,
      role: practiceMemberships.role,
    })
    .from(practiceMemberships)
    .innerJoin(users, eq(users.id, practiceMemberships.userId))
    .where(and(eq(practiceMemberships.practiceId, practiceId), eq(practiceMemberships.status, "active")));

  const pick =
    members.find((m) => m.userId === createdByUserId) ??
    members.find((m) => m.role === "physician") ??
    members[0];

  if (!pick) {
    const [creator] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        mobilePhone: users.mobilePhone,
      })
      .from(users)
      .where(eq(users.id, createdByUserId))
      .limit(1);
    if (!creator) return null;
    return {
      name: displayName(creator.firstName, creator.lastName, creator.email),
      email: creator.email,
      phone: creator.mobilePhone || practicePhone || null,
    };
  }

  return {
    name: displayName(pick.firstName, pick.lastName, pick.email),
    email: pick.email,
    phone: pick.mobilePhone || practicePhone || null,
  };
}

async function serializePractice(
  db: Awaited<ReturnType<typeof getDb>>,
  row: {
    id: string;
    name: string;
    phone: string;
    postalCode: string;
    city: string;
    state: string;
    createdByUserId: string;
    nameZipKey: string | null;
  },
) {
  return {
    id: row.id,
    name: row.name,
    postalCode: row.postalCode,
    postalCodeDisplay: formatZipDisplay(row.postalCode),
    city: row.city,
    state: row.state,
    nameZipKey: row.nameZipKey,
    label: `${row.name} · ${formatZipDisplay(row.postalCode)}${row.city ? ` · ${row.city}` : ""}${row.state ? `, ${row.state}` : ""}`,
    admin: await adminForPractice(db, row.id, row.createdByUserId, row.phone),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const zip = url.searchParams.get("zip")?.trim().slice(0, 20) ?? "";
  if (query.length < 2) {
    return NextResponse.json({ practices: [], exact: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const db = await getDb();
  const needle = query.toLowerCase();
  const rows = await db
    .select({
      id: practices.id,
      name: practices.name,
      phone: practices.phone,
      postalCode: practices.postalCode,
      city: practices.city,
      state: practices.state,
      createdByUserId: practices.createdByUserId,
      nameZipKey: practices.nameZipKey,
    })
    .from(practices)
    .where(and(eq(practices.status, "active"), sql`position(${needle} in lower(${practices.name})) > 0`))
    .orderBy(practices.name, practices.postalCode)
    .limit(12);

  const practicesOut = [];
  for (const row of rows) {
    practicesOut.push(await serializePractice(db, row));
  }

  let exact = null;
  if (zip) {
    const key = practiceNameZipKey(query, zip);
    exact = practicesOut.find((p) => p.nameZipKey === key) ?? null;
    if (!exact) {
      const [row] = await db
        .select({
          id: practices.id,
          name: practices.name,
          phone: practices.phone,
          postalCode: practices.postalCode,
          city: practices.city,
          state: practices.state,
          createdByUserId: practices.createdByUserId,
          nameZipKey: practices.nameZipKey,
        })
        .from(practices)
        .where(and(eq(practices.status, "active"), eq(practices.nameZipKey, key)))
        .limit(1);
      if (row) exact = await serializePractice(db, row);
    }
  }

  return NextResponse.json(
    { practices: practicesOut, exact },
    { headers: { "Cache-Control": "no-store" } },
  );
}
