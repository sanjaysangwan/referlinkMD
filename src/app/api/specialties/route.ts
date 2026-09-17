import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { specialties, specialtySubspecialties } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const specs = await db
    .select({
      id: specialties.id,
      name: specialties.name,
      sortOrder: specialties.sortOrder,
    })
    .from(specialties)
    .where(eq(specialties.status, "active"))
    .orderBy(asc(specialties.sortOrder), asc(specialties.name));

  const subs = await db
    .select({
      id: specialtySubspecialties.id,
      specialtyId: specialtySubspecialties.specialtyId,
      name: specialtySubspecialties.name,
      sortOrder: specialtySubspecialties.sortOrder,
    })
    .from(specialtySubspecialties)
    .orderBy(asc(specialtySubspecialties.sortOrder), asc(specialtySubspecialties.name));

  const bySpecialty = new Map<string, Array<{ id: string; name: string }>>();
  for (const sub of subs) {
    const list = bySpecialty.get(sub.specialtyId) ?? [];
    list.push({ id: sub.id, name: sub.name });
    bySpecialty.set(sub.specialtyId, list);
  }

  return NextResponse.json({
    specialties: specs.map((s) => ({
      id: s.id,
      name: s.name,
      subspecialties: bySpecialty.get(s.id) ?? [],
    })),
  });
}
