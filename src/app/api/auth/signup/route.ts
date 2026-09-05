import { NextResponse } from "next/server";
import { z } from "zod";
import { practices, practiceMemberships, users } from "@/db/schema";
import { getDb } from "@/db";
import { createSession, homePath, loadSessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";
import type { PracticeRole } from "@/lib/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  practiceName: z.string().min(2),
  role: z.enum(["physician", "app", "office_manager"]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter email, a password (10+ characters), practice name, and your credential." },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const role = d.role as PracticeRole;
  const db = await getDb();
  const userId = crypto.randomUUID();
  const practiceId = crypto.randomUUID();
  const now = new Date();
  const { ip, userAgent } = await requestMeta();

  try {
    await db.insert(users).values({
      id: userId,
      email: d.email.toLowerCase().trim(),
      passwordHash: await hashPassword(d.password),
      firstName: "",
      lastName: "",
      mustChangePassword: false,
      status: "active",
    });
    await db.insert(practices).values({
      id: practiceId,
      name: d.practiceName.trim(),
      phone: "",
      fax: "",
      logo: null,
      addressLine1: "",
      city: "",
      state: "",
      postalCode: "",
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
    const msg = String(err instanceof Error ? err.message : err).toLowerCase();
    if (msg.includes("unique") && msg.includes("email")) {
      return NextResponse.json({ error: "That email is already registered. Sign in instead." }, { status: 409 });
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
    metadata: { role },
  });
  await createSession(userId);
  const session = await loadSessionUser(userId);
  return NextResponse.json({ ok: true, home: session ? homePath(session) : "/mfa/setup", practiceId });
}
