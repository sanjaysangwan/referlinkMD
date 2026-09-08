import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { addFavoriteConsultant, listFavoriteConsultants } from "@/lib/favorites";

const addSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7),
});

export async function GET() {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const favorites = await listFavoriteConsultants(session.id);
  return NextResponse.json({ favorites });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a name and mobile number." }, { status: 400 });
  }
  const result = await addFavoriteConsultant({
    ownerUserId: session.id,
    name: parsed.data.name,
    phone: parsed.data.phone,
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
