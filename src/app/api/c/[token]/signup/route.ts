import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { accessTokens, users } from "@/db/schema";
import { getDb } from "@/db";
import { createSession, loadSessionUser } from "@/lib/auth";
import { hashPassword, sha256Hex } from "@/lib/crypto";
import { npiValid, bindConsultsToUser } from "@/lib/clinician";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  npi: z.string().regex(/^\d{10}$/),
  password: z.string().min(10),
});

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter name, email, 10-digit NPI, and a password." }, { status: 400 });
  }
  if (!npiValid(parsed.data.npi)) {
    return NextResponse.json({ error: "NPI must be 10 digits." }, { status: 400 });
  }

  const db = await getDb();
  const [row] = await db
    .select()
    .from(accessTokens)
    .where(eq(accessTokens.tokenHash, sha256Hex(token)))
    .limit(1);
  if (!row || row.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This link is invalid or expired." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const firstName = parsed.data.firstName.trim();
  const lastName = parsed.data.lastName.trim();
  const npi = parsed.data.npi;
  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();

  const [existingByPhone] = await db
    .select()
    .from(users)
    .where(eq(users.mobilePhone, row.consultingPhone))
    .limit(1);

  if (existingByPhone?.status === "active") {
    return NextResponse.json(
      { error: "That mobile number is already registered. Sign in instead." },
      { status: 409 },
    );
  }

  let userId: string;
  try {
    if (existingByPhone?.status === "invited") {
      userId = existingByPhone.id;
      await db
        .update(users)
        .set({
          email,
          passwordHash,
          firstName,
          lastName,
          npi,
          mobileVerifiedAt: now,
          mustChangePassword: false,
          status: "active",
        })
        .where(eq(users.id, userId));
    } else {
      userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash,
        firstName,
        lastName,
        npi,
        mobilePhone: row.consultingPhone,
        mobileVerifiedAt: now,
        mustChangePassword: false,
        status: "active",
      });
    }
  } catch {
    return NextResponse.json(
      { error: "That email or mobile number is already registered. Sign in instead." },
      { status: 409 },
    );
  }

  await bindConsultsToUser(userId, row.consultingPhone);
  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: userId,
    action: "account_created",
    resourceType: "consult",
    resourceId: row.consultId,
    ip,
    userAgent,
    metadata: { via: "sms_token", adoptedStub: Boolean(existingByPhone?.status === "invited") },
  });
  await createSession(userId);
  const session = await loadSessionUser(userId);
  return NextResponse.json({
    ok: true,
    consultId: row.consultId,
    home: session?.mfaEnabled ? `/consults/${row.consultId}` : "/mfa/setup",
    next: `/consults/${row.consultId}`,
  });
}
