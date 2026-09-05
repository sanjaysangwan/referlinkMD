import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { practices } from "@/db/schema";
import { getDb } from "@/db";
import { getSession } from "@/lib/auth";
import { toE164 } from "@/lib/phone";
import { isPracticeLogoDataUrl } from "@/lib/practice-logo";
import { writeAudit } from "@/lib/audit";
import { requestMeta } from "@/lib/request";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  logo: z.string().nullable().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.isPracticeCreator || !session.practiceId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = await getDb();
  const [practice] = await db.select().from(practices).where(eq(practices.id, session.practiceId)).limit(1);
  if (!practice) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({
    id: practice.id,
    name: practice.name,
    phone: practice.phone,
    fax: practice.fax,
    logo: practice.logo,
    addressLine1: practice.addressLine1,
    addressLine2: practice.addressLine2,
    city: practice.city,
    state: practice.state,
    postalCode: practice.postalCode,
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session?.isPracticeCreator || !session.practiceId) {
    return NextResponse.json({ error: "Not allowed to update this practice." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the practice details and try again." }, { status: 400 });
  }

  const patch: Record<string, string | null | Date> = { updatedAt: new Date() };
  if (parsed.data.name) patch.name = parsed.data.name.trim();
  if (parsed.data.phone !== undefined) {
    if (!parsed.data.phone.trim()) patch.phone = "";
    else {
      const phone = toE164(parsed.data.phone);
      if (!phone) return NextResponse.json({ error: "Use a valid US phone number." }, { status: 400 });
      patch.phone = phone;
    }
  }
  if (parsed.data.fax !== undefined) {
    if (!parsed.data.fax.trim()) patch.fax = "";
    else {
      const fax = toE164(parsed.data.fax);
      if (!fax) return NextResponse.json({ error: "Use a valid US fax number." }, { status: 400 });
      patch.fax = fax;
    }
  }
  if (parsed.data.logo !== undefined) {
    if (parsed.data.logo && !isPracticeLogoDataUrl(parsed.data.logo)) {
      return NextResponse.json({ error: "Upload a small PNG, JPEG, WebP, GIF, or SVG logo." }, { status: 400 });
    }
    patch.logo = parsed.data.logo;
  }
  if (parsed.data.addressLine1 !== undefined) patch.addressLine1 = parsed.data.addressLine1.trim();
  if (parsed.data.addressLine2 !== undefined) patch.addressLine2 = parsed.data.addressLine2.trim() || null;
  if (parsed.data.city !== undefined) patch.city = parsed.data.city.trim();
  if (parsed.data.state !== undefined) patch.state = parsed.data.state.trim().toUpperCase();
  if (parsed.data.postalCode !== undefined) patch.postalCode = parsed.data.postalCode.trim();

  const db = await getDb();
  await db.update(practices).set(patch).where(eq(practices.id, session.practiceId));
  const { ip, userAgent } = await requestMeta();
  await writeAudit({
    actorUserId: session.id,
    action: "practice_updated",
    resourceType: "practice",
    resourceId: session.practiceId,
    ip,
    userAgent,
  });
  const [practice] = await db.select().from(practices).where(eq(practices.id, session.practiceId)).limit(1);
  return NextResponse.json({
    ok: true,
    id: practice?.id,
    name: practice?.name,
    phone: practice?.phone,
    fax: practice?.fax,
    logo: practice?.logo,
    addressLine1: practice?.addressLine1,
    addressLine2: practice?.addressLine2,
    city: practice?.city,
    state: practice?.state,
    postalCode: practice?.postalCode,
  });
}
