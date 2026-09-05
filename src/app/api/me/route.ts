import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { toE164 } from "@/lib/phone";
import { npiValid } from "@/lib/clinician";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";

const patchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  npi: z.string().optional(),
  mobilePhone: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: session.id,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    npi: session.npi,
    mobilePhone: session.mobilePhone,
    role: session.role,
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

  const patch: {
    firstName?: string;
    lastName?: string;
    npi?: string | null;
    mobilePhone?: string | null;
    mobileVerifiedAt?: Date | null;
  } = {};
  if (parsed.data.firstName !== undefined) patch.firstName = parsed.data.firstName.trim();
  if (parsed.data.lastName !== undefined) patch.lastName = parsed.data.lastName.trim();
  if (parsed.data.npi !== undefined) {
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

  const db = await getDb();
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
