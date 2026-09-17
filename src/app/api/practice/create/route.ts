import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { practices, practiceMemberships } from "@/db/schema";
import { getDb } from "@/db";
import { getSession, homePath, loadSessionUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import { isValidUsZip, normalizePostalCode, practiceNameZipKey } from "@/lib/practice-identity";
import { ensureIndependentHealthSystem } from "@/lib/health-systems";
import type { PracticeRole } from "@/lib/types";

const schema = z.object({
  practiceName: z.string().min(2),
  postalCode: z.string().min(5),
  role: z.enum(["physician", "app", "office_manager"]),
});

/** Create a practice for a logged-in user who is not currently on one (defaults to Independent). */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.practiceId) {
    return NextResponse.json(
      { error: "Leave your current practice before creating a new one." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter practice name, ZIP code, and your credential." },
      { status: 400 },
    );
  }
  if (!isValidUsZip(parsed.data.postalCode)) {
    return NextResponse.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400 });
  }

  const practiceName = parsed.data.practiceName.trim();
  const postalCode = normalizePostalCode(parsed.data.postalCode);
  const nameZipKey = practiceNameZipKey(practiceName, postalCode);
  const role = parsed.data.role as PracticeRole;
  const db = await getDb();

  const [existingPractice] = await db
    .select({ id: practices.id, name: practices.name, postalCode: practices.postalCode })
    .from(practices)
    .where(eq(practices.nameZipKey, nameZipKey))
    .limit(1);
  if (existingPractice) {
    return NextResponse.json(
      {
        error: `“${existingPractice.name}” (${existingPractice.postalCode}) already exists. Ask that practice to invite you, or claim the name if this is incorrect.`,
      },
      { status: 409 },
    );
  }

  const healthSystemId = await ensureIndependentHealthSystem(db);
  const practiceId = crypto.randomUUID();
  const now = new Date();

  await db.insert(practices).values({
    id: practiceId,
    healthSystemId,
    name: practiceName,
    phone: "",
    fax: "",
    logo: null,
    addressLine1: "",
    city: "",
    state: "",
    postalCode,
    nameZipKey,
    status: "active",
    createdByUserId: session.id,
  });
  await db.insert(practiceMemberships).values({
    id: crypto.randomUUID(),
    practiceId,
    userId: session.id,
    role,
    status: "active",
    acceptedAt: now,
  });

  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: session.id,
    action: "practice_updated",
    resourceType: "practice",
    resourceId: practiceId,
    ip,
    userAgent,
    metadata: { created: true, role, healthSystemId },
  });

  const next = await loadSessionUser(session.id);
  return NextResponse.json({
    ok: true,
    practiceId,
    home: next ? homePath(next) : "/consults",
  });
}
