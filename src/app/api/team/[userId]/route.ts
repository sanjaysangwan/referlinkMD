import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { practiceMemberships, users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { toE164 } from "@/lib/phone";
import { npiValid } from "@/lib/clinician";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import type { PracticeRole } from "@/lib/types";

const patchSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  npi: z.string().optional(),
  mobilePhone: z.string().optional(),
  role: z.enum(["physician", "app", "office_manager"]).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session?.isPracticeCreator || !session.practiceId) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  const { userId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the details and try again." }, { status: 400 });
  }

  const db = await getDb();
  const [membership] = await db
    .select()
    .from(practiceMemberships)
    .where(
      and(
        eq(practiceMemberships.practiceId, session.practiceId),
        eq(practiceMemberships.userId, userId),
      ),
    )
    .limit(1);
  if (!membership || membership.status === "revoked") {
    return NextResponse.json({ error: "That person is not on this practice." }, { status: 404 });
  }

  const userPatch: {
    firstName?: string;
    lastName?: string;
    npi?: string | null;
    mobilePhone?: string | null;
    mobileVerifiedAt?: Date | null;
  } = {};
  if (parsed.data.firstName !== undefined) userPatch.firstName = parsed.data.firstName.trim();
  if (parsed.data.lastName !== undefined) userPatch.lastName = parsed.data.lastName.trim();
  if (parsed.data.npi !== undefined) {
    const npi = parsed.data.npi.trim();
    if (npi && !npiValid(npi)) {
      return NextResponse.json({ error: "NPI must be 10 digits." }, { status: 400 });
    }
    userPatch.npi = npi || null;
  }
  if (parsed.data.mobilePhone !== undefined) {
    const raw = parsed.data.mobilePhone.trim();
    if (!raw) {
      userPatch.mobilePhone = null;
      userPatch.mobileVerifiedAt = null;
    } else {
      const mobile = toE164(raw);
      if (!mobile) return NextResponse.json({ error: "Use a valid US mobile number." }, { status: 400 });
      userPatch.mobilePhone = mobile;
      userPatch.mobileVerifiedAt = new Date();
    }
  }

  if (Object.keys(userPatch).length) {
    await db.update(users).set(userPatch).where(eq(users.id, userId));
  }
  if (parsed.data.role && parsed.data.role !== membership.role) {
    await db
      .update(practiceMemberships)
      .set({ role: parsed.data.role })
      .where(eq(practiceMemberships.id, membership.id));
  }

  if (Object.keys(userPatch).length || (parsed.data.role && parsed.data.role !== membership.role)) {
    const { ip, userAgent } = await requestMeta();
    await writeAudit({
      actorUserId: session.id,
      action: parsed.data.role && parsed.data.role !== membership.role ? "role_changed" : "practice_updated",
      resourceType: "user",
      resourceId: userId,
      ip,
      userAgent,
      metadata: parsed.data.role ? { role: parsed.data.role } : undefined,
    });
  }
  return NextResponse.json({ ok: true });
}
