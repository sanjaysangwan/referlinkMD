import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { healthSystems } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const rows = await db
    .select({
      id: healthSystems.id,
      name: healthSystems.name,
      logo: healthSystems.logo,
    })
    .from(healthSystems)
    .where(eq(healthSystems.status, "active"))
    .orderBy(asc(healthSystems.name));
  return NextResponse.json({ healthSystems: rows });
}
