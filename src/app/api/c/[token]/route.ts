import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { accessTokens, consults, users } from "@/db/schema";
import { getDb } from "@/db";
import { sha256Hex } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const db = await getDb();
  const [row] = await db
    .select({ token: accessTokens, consult: consults })
    .from(accessTokens)
    .innerJoin(consults, eq(consults.id, accessTokens.consultId))
    .where(eq(accessTokens.tokenHash, sha256Hex(token)))
    .limit(1);

  if (!row || row.token.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This link is invalid or expired." }, { status: 400 });
  }

  const [activeUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.mobilePhone, row.token.consultingPhone), eq(users.status, "active")))
    .limit(1);

  const [stubUser] = activeUser
    ? [null]
    : await db
        .select()
        .from(users)
        .where(and(eq(users.mobilePhone, row.token.consultingPhone), eq(users.status, "invited")))
        .limit(1);

  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    action: "token_consumed",
    resourceType: "access_token",
    resourceId: row.token.id,
    ip,
    userAgent,
    metadata: { stage: "landing", hasAccount: Boolean(activeUser) },
  });

  const prefillName = stubUser
    ? `${stubUser.firstName} ${stubUser.lastName}`.trim()
    : row.consult.consultingName;

  return NextResponse.json({
    ok: true,
    consultId: row.consult.id,
    needsSignup: !activeUser,
    consultingName: row.consult.consultingName,
    prefillFirstName: stubUser?.firstName ?? "",
    prefillLastName: stubUser?.lastName ?? "",
    prefillDisplayName: prefillName,
  });
}
