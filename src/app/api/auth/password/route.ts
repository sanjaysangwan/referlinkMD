import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { getDb } from "@/db";
import { getSession, homePath, loadSessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";

const schema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(10),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
  }

  const db = await getDb();
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: false })
    .where(eq(users.id, session.id));

  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: session.id,
    action: "password_changed",
    resourceType: "user",
    resourceId: session.id,
    ip,
    userAgent,
  });
  const next = await loadSessionUser(session.id);
  return NextResponse.json({ ok: true, home: next ? homePath(next) : "/consults" });
}
