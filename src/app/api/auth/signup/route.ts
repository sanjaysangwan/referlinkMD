import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { practices, practiceMemberships, users } from "@/db/schema";
import { getDb } from "@/db";
import { createSession, homePath, loadSessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import { isValidUsZip, normalizePostalCode, practiceNameZipKey } from "@/lib/practice-identity";
import type { PracticeRole } from "@/lib/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  practiceName: z.string().min(2),
  postalCode: z.string().min(5),
  role: z.enum(["physician", "app", "office_manager"]),
});

const EMAIL_IN_USE =
  "Email is already in use. Please log in, and use Forgot password if you don’t remember it.";

function isDuplicateEmailError(err: unknown): boolean {
  const parts: string[] = [];
  let current: unknown = err;
  for (let i = 0; i < 4 && current; i++) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = (current as Error & { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  const msg = parts.join(" ").toLowerCase();
  return (
    msg.includes("users_email") ||
    (msg.includes("duplicate") && msg.includes("email")) ||
    (msg.includes("unique") && msg.includes("email"))
  );
}

function isDuplicatePracticeError(err: unknown): boolean {
  const parts: string[] = [];
  let current: unknown = err;
  for (let i = 0; i < 4 && current; i++) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = (current as Error & { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  const msg = parts.join(" ").toLowerCase();
  return msg.includes("practices_name_zip") || msg.includes("name_zip_key");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Enter email, a password (10+ characters), practice name, ZIP code, and your credential.",
      },
      { status: 400 },
    );
  }
  const d = parsed.data;
  if (!isValidUsZip(d.postalCode)) {
    return NextResponse.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400 });
  }

  const role = d.role as PracticeRole;
  const db = await getDb();
  const email = d.email.toLowerCase().trim();
  const practiceName = d.practiceName.trim();
  const postalCode = normalizePostalCode(d.postalCode);
  const nameZipKey = practiceNameZipKey(practiceName, postalCode);
  const userId = crypto.randomUUID();
  const practiceId = crypto.randomUUID();
  const now = new Date();
  const { ip, userAgent } = await requestMeta();

  const [existingPractice] = await db
    .select({ id: practices.id, name: practices.name, postalCode: practices.postalCode })
    .from(practices)
    .where(eq(practices.nameZipKey, nameZipKey))
    .limit(1);
  if (existingPractice) {
    return NextResponse.json(
      {
        error: `“${existingPractice.name}” (${existingPractice.postalCode}) already exists. Contact that practice’s administrator to request addition, or claim the name if this is incorrect.`,
      },
      { status: 409 },
    );
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: EMAIL_IN_USE }, { status: 409 });
  }

  try {
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash: await hashPassword(d.password),
      firstName: "",
      lastName: "",
      mustChangePassword: false,
      status: "active",
    });
    await db.insert(practices).values({
      id: practiceId,
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
      createdByUserId: userId,
    });
    await db.insert(practiceMemberships).values({
      id: crypto.randomUUID(),
      practiceId,
      userId,
      role,
      status: "active",
      acceptedAt: now,
    });
  } catch (err) {
    if (isDuplicateEmailError(err)) {
      return NextResponse.json({ error: EMAIL_IN_USE }, { status: 409 });
    }
    if (isDuplicatePracticeError(err)) {
      return NextResponse.json(
        {
          error:
            "A practice with this name and ZIP already exists. Contact that practice’s administrator, or claim the name if this is incorrect.",
        },
        { status: 409 },
      );
    }
    console.error("signup failed", err);
    return NextResponse.json({ error: "Could not create the practice. Try again." }, { status: 500 });
  }

  await writeAudit({
    actorUserId: userId,
    action: "account_created",
    resourceType: "practice",
    resourceId: practiceId,
    ip,
    userAgent,
    metadata: { role, nameZipKey },
  });
  await createSession(userId);
  const session = await loadSessionUser(userId);
  return NextResponse.json({ ok: true, home: session ? homePath(session) : "/mfa/setup", practiceId });
}
