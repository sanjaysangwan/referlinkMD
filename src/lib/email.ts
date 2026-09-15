import nodemailer from "nodemailer";
import { APP_NAME } from "./brand";
import { isDemo } from "./env";

export function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || `${APP_NAME} <noreply@referlinkmd.local>`;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim());
}

/** Deliver email via Resend or SMTP when configured. Returns provider message id. */
export async function deliverEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ providerMessageId: string; delivered: boolean }> {
  const from = emailFrom();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      throw new Error(data.message || `Resend error ${res.status}`);
    }
    return { providerMessageId: data.id || crypto.randomUUID(), delivered: true };
  }

  const host = process.env.SMTP_HOST?.trim();
  if (host) {
    const port = Number(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass: pass || "" } : undefined,
    });
    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return {
      providerMessageId: String(info.messageId || crypto.randomUUID()),
      delivered: true,
    };
  }

  if (!isDemo()) {
    throw new Error("Email is not configured. Set RESEND_API_KEY or SMTP_HOST.");
  }
  return { providerMessageId: crypto.randomUUID(), delivered: false };
}
