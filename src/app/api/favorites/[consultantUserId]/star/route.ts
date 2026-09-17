import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { setFavoriteStar } from "@/lib/favorites";

const bodySchema = z.object({
  starred: z.boolean(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ consultantUserId: string }> },
) {
  const session = await getSession();
  if (!session?.mfaEnabled || session.mustChangePassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.practiceId) {
    return NextResponse.json({ error: "Join a practice to use the directory." }, { status: 400 });
  }
  const { consultantUserId } = await context.params;
  if (!consultantUserId) {
    return NextResponse.json({ error: "Missing consultant." }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the request and try again." }, { status: 400 });
  }
  const result = await setFavoriteStar({
    practiceId: session.practiceId,
    userId: session.id,
    consultantUserId,
    starred: parsed.data.starred,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, starred: result.starred });
}
