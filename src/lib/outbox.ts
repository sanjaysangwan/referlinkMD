import { desc } from "drizzle-orm";
import { demoOutbox, notifications } from "@/db/schema";
import { getDb } from "@/db";
import { isDemo } from "./env";

export async function sendDemoMessage(input: {
  channel: "sms" | "email";
  toAddress: string;
  templateKey: string;
  body: string;
  consultId?: string | null;
  toPhone?: string | null;
  toEmail?: string | null;
}): Promise<string> {
  const db = await getDb();
  const id = crypto.randomUUID();
  if (isDemo()) {
    await db.insert(demoOutbox).values({
      id,
      channel: input.channel,
      toAddress: input.toAddress,
      templateKey: input.templateKey,
      body: input.body,
    });
  }
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    consultId: input.consultId ?? null,
    channel: input.channel,
    toPhone: input.toPhone ?? null,
    toEmail: input.toEmail ?? null,
    templateKey: input.templateKey,
    providerMessageId: id,
    status: "sent",
  });
  if (isDemo()) {
    console.info(`[demo ${input.channel}] ${input.templateKey} -> ${input.toAddress}`);
  }
  return id;
}

export async function listDemoOutbox(limit = 40) {
  const db = await getDb();
  return db.select().from(demoOutbox).orderBy(desc(demoOutbox.createdAt)).limit(limit);
}
