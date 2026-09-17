import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { removeFavoriteConsultant } from "@/lib/favorites";

export async function DELETE(
  _request: Request,
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
  const removed = await removeFavoriteConsultant(session.practiceId, consultantUserId);
  if (!removed) {
    return NextResponse.json({ error: "Directory entry not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
