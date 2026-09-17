import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { addFavoriteConsultant, listFavoriteConsultants } from "@/lib/favorites";

const addSchema = z
  .object({
    name: z.string().min(1),
    mobilePhone: z.string().optional(),
    officePhone: z.string().optional(),
    /** @deprecated prefer mobilePhone */
    phone: z.string().optional(),
  })
  .refine((v) => Boolean((v.mobilePhone || v.phone || "").trim() || (v.officePhone || "").trim()), {
    message: "Enter at least one phone number.",
  });

export async function GET() {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.practiceId) {
    return NextResponse.json({ error: "Join a practice to use the directory." }, { status: 400 });
  }
  const favorites = await listFavoriteConsultants(session.practiceId, session.id);
  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.practiceId) {
    return NextResponse.json({ error: "Join a practice to use the directory." }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a name and at least one phone number (office or cell)." },
      { status: 400 },
    );
  }
  const result = await addFavoriteConsultant({
    practiceId: session.practiceId,
    addedByUserId: session.id,
    name: parsed.data.name,
    mobilePhone: parsed.data.mobilePhone || parsed.data.phone,
    officePhone: parsed.data.officePhone,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    ok: true,
    status: result.status,
    message: result.message,
    consultant: result.consultant,
  });
}
