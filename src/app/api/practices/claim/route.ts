import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { practices, users } from "@/db/schema";
import { getDb } from "@/db";
import { writeAudit } from "@/lib/audit";
import { sendPracticeClaimEmail } from "@/lib/notify";
import { requestMeta } from "@/lib/request";

const schema = z.object({
  practiceId: z.string().uuid(),
  claimantEmail: z.string().email(),
  claimantName: z.string().max(120).optional(),
  note: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your email so we can follow up on this claim." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [practice] = await db
    .select()
    .from(practices)
    .where(eq(practices.id, parsed.data.practiceId))
    .limit(1);
  if (!practice || practice.status !== "active") {
    return NextResponse.json({ error: "Practice not found." }, { status: 404 });
  }

  const [creator] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, practice.createdByUserId))
    .limit(1);

  const { ip, userAgent } = await requestMeta();
  const claimantEmail = parsed.data.claimantEmail.toLowerCase().trim();
  const claimantName = parsed.data.claimantName?.trim() || "";
  const note = parsed.data.note?.trim() || "";

  try {
    await sendPracticeClaimEmail({
      practiceId: practice.id,
      practiceName: practice.name,
      postalCode: practice.postalCode,
      adminEmail: creator?.email ?? null,
      claimantEmail,
      claimantName,
      note,
    });
  } catch (err) {
    console.error("practice claim email failed", err);
    return NextResponse.json(
      { error: "Could not send the claim request. Try again in a moment." },
      { status: 502 },
    );
  }

  await writeAudit({
    action: "practice_claim_requested",
    resourceType: "practice",
    resourceId: practice.id,
    ip,
    userAgent,
    metadata: {
      claimantEmail,
      claimantName: claimantName || null,
    },
  });

  return NextResponse.json({
    ok: true,
    message:
      "Thanks. We received your claim request and will follow up at the email you provided.",
  });
}
