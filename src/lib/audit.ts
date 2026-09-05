import { eq } from "drizzle-orm";
import { auditEvents } from "@/db/schema";
import { getDb } from "@/db";
import type { AuditAction } from "./types";

export async function writeAudit(input: {
  actorUserId?: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const db = await getDb();
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function listAuditForActor(userId: string, limit = 50) {
  const db = await getDb();
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.actorUserId, userId))
    .limit(limit);
}
