import { desc } from "drizzle-orm";
import { demoOutbox, notifications } from "@/db/schema";
import { getDb } from "@/db";
import { deliverEmail } from "./email";
import { isDemo } from "./env";

export async function sendDemoMessage(input: {
  channel: "sms" | "email";
  toAddress: string;
  templateKey: string;
  body: string;
  subject?: string;
  consultId?: string | null;
  toPhone?: string | null;
  toEmail?: string | null;
}): Promise<string> {
  const db = await getDb();
  const localId = crypto.randomUUID();
  let providerMessageId = localId;
  let status: "sent" | "failed" = "sent";
  let errorCode: string | null = null;

  if (input.channel === "email") {
    try {
      const result = await deliverEmail({
        to: input.toAddress,
        subject: input.subject || `${input.templateKey}`,
        text: input.body,
      });
      providerMessageId = result.providerMessageId;
      if (!result.delivered && isDemo()) {
        console.info(`[demo email] ${input.templateKey} -> ${input.toAddress} (no provider; Demo inbox only)`);
      }
    } catch (err) {
      status = "failed";
      errorCode = err instanceof Error ? err.message.slice(0, 200) : "email_send_failed";
      console.error("email delivery failed", err);
      if (!isDemo()) throw err;
    }
  } else if (isDemo()) {
    console.info(`[demo ${input.channel}] ${input.templateKey} -> ${input.toAddress}`);
  }

  if (isDemo()) {
    await db.insert(demoOutbox).values({
      id: localId,
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
    providerMessageId,
    status,
    errorCode,
  });

  return providerMessageId;
}

export async function listDemoOutbox(limit = 40) {
  const db = await getDb();
  return db.select().from(demoOutbox).orderBy(desc(demoOutbox.createdAt)).limit(limit);
}
