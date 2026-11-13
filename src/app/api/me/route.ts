import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { toE164 } from "@/lib/phone";
import { npiValid } from "@/lib/clinician";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import { validatePhysicianSpecialty } from "@/lib/specialty";

const patchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  npi: z.string().optional(),
  mobilePhone: z.string().optional(),
  specialtyId: z.string().uuid().nullable().optional(),
  subspecialtyId: z.string().uuid().nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: session.id,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    npi: session.role === "physician" ? session.npi : null,
    mobilePhone: session.mobilePhone,
    role: session.role,
    specialtyId: session.specialtyId,
    subspecialtyId: session.subspecialtyId,
    specialtyName: session.specialtyName,
    subspecialtyName: session.subspecialtyName,
    specialtyLabel: session.specialtyLabel,
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your profile details and try again." }, { status: 400 });
  }

  const db = await getDb();
  const patch: {
    firstName?: string;
    lastName?: string;
    email?: string;
    npi?: string | null;
    mobilePhone?: string | null;
    mobileVerifiedAt?: Date | null;
    specialtyId?: string | null;
    subspecialtyId?: string | null;
  } = {};
  if (parsed.data.firstName !== undefined) patch.firstName = parsed.data.firstName.trim();
  if (parsed.data.lastName !== undefined) patch.lastName = parsed.data.lastName.trim();
  if (parsed.data.email !== undefined) {
    const email = parsed.data.email.toLowerCase().trim();
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, session.id)))
      .limit(1);
    if (taken) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    patch.email = email;
  }
  if (parsed.data.npi !== undefined) {
    if (session.role !== "physician") {
      return NextResponse.json({ error: "Only physicians have an NPI." }, { status: 400 });
    }
    const npi = parsed.data.npi.trim();
    if (npi && !npiValid(npi)) {
      return NextResponse.json({ error: "NPI must be 10 digits." }, { status: 400 });
    }
    patch.npi = npi || null;
  }
  if (parsed.data.mobilePhone !== undefined) {
    const raw = parsed.data.mobilePhone.trim();
    if (!raw) {
      patch.mobilePhone = null;
      patch.mobileVerifiedAt = null;
    } else {
      const mobile = toE164(raw);
      if (!mobile) return NextResponse.json({ error: "Use a valid US mobile number." }, { status: 400 });
      patch.mobilePhone = mobile;
      patch.mobileVerifiedAt = new Date();
    }
  }

  const specialtyTouched =
    parsed.data.specialtyId !== undefined || parsed.data.subspecialtyId !== undefined;
  if (specialtyTouched) {
    if (session.role !== "physician") {
      return NextResponse.json({ error: "Only physicians have a specialty." }, { status: 400 });
    }
    const specialtyId =
      parsed.data.specialtyId !== undefined ? parsed.data.specialtyId : session.specialtyId;
    const subspecialtyId =
      parsed.data.subspecialtyId !== undefined ? parsed.data.subspecialtyId : session.subspecialtyId;
    const check = await validatePhysicianSpecialty(db, { specialtyId, subspecialtyId });
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    patch.specialtyId = specialtyId;
    patch.subspecialtyId = specialtyId ? subspecialtyId : null;
  }

  await db.update(users).set(patch).where(eq(users.id, session.id));
  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: session.id,
    action: "practice_updated",
    resourceType: "user",
    resourceId: session.id,
    ip,
    userAgent,
  });
  return NextResponse.json({ ok: true });
}
