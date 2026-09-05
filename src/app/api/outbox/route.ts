import { NextResponse } from "next/server";
import { listDemoOutbox } from "@/lib/outbox";
import { getSession } from "@/lib/auth";
import { isDemo } from "@/lib/env";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDemo()) {
    return NextResponse.json({ error: "Outbox is only available in demo." }, { status: 404 });
  }
  const messages = await listDemoOutbox();
  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      channel: m.channel,
      to: m.toAddress,
      templateKey: m.templateKey,
      body: m.body,
      createdAt: m.createdAt,
    })),
  });
}
