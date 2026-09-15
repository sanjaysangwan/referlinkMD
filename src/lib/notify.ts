import { APP_NAME } from "./brand";
import { appUrl } from "./env";
import { sendDemoMessage } from "./outbox";
import { writeAudit } from "./audit";

const CONSULT_TEMPLATE = "consult_ready_no_phi";

/** SMS body must never include patient name, DOB, or phone. Physician identity is public. */
export function consultSmsBody(input: { requestingClinicianName: string; link: string }): string {
  return `${input.requestingClinicianName} requested a consult. Open this secure link (expires in 24 hours): ${input.link}`;
}

export async function sendConsultSms(input: {
  consultId: string;
  consultingPhone: string;
  rawToken: string;
  requestingClinicianName: string;
  actorUserId: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  const link = `${appUrl()}/c/${input.rawToken}`;
  const body = consultSmsBody({
    requestingClinicianName: input.requestingClinicianName,
    link,
  });
  await sendDemoMessage({
    channel: "sms",
    toAddress: input.consultingPhone,
    templateKey: CONSULT_TEMPLATE,
    body,
    consultId: input.consultId,
    toPhone: input.consultingPhone,
  });
  await writeAudit({
    actorUserId: input.actorUserId,
    action: "sms_sent",
    resourceType: "consult",
    resourceId: input.consultId,
    ip: input.ip,
    userAgent: input.userAgent,
    metadata: { template: CONSULT_TEMPLATE },
  });
}

export async function sendInviteEmail(input: {
  toEmail: string;
  practiceName: string;
  rawToken: string;
  role: string;
}): Promise<void> {
  const link = `${appUrl()}/invite/${input.rawToken}`;
  const body = `You were invited to join ${input.practiceName} on ${APP_NAME} as ${input.role}. Create your password and activate your login: ${link}\nThis email contains no patient information.`;
  await sendDemoMessage({
    channel: "email",
    toAddress: input.toEmail,
    templateKey: "practice_invite_no_phi",
    subject: `You're invited to ${input.practiceName} on ${APP_NAME}`,
    body,
    toEmail: input.toEmail,
  });
}

export async function sendPasswordResetEmail(input: {
  toEmail: string;
  rawToken: string;
}): Promise<void> {
  const link = `${appUrl()}/reset/${input.rawToken}`;
  const body = `Reset your ${APP_NAME} password using this link (expires in 1 hour): ${link}\nIf you did not request a reset, you can ignore this email.\nThis email contains no patient information.`;
  await sendDemoMessage({
    channel: "email",
    toAddress: input.toEmail,
    templateKey: "password_reset_no_phi",
    subject: `Reset your ${APP_NAME} password`,
    body,
    toEmail: input.toEmail,
  });
}

function supportContactLine(): string {
  return process.env.SUPPORT_EMAIL?.trim() || "support@ReferlinkMD.com";
}

export async function sendPasswordChangedEmail(input: { toEmail: string }): Promise<void> {
  const loginUrl = `${appUrl()}/login`;
  const settingsUrl = `${appUrl()}/settings`;
  const support = supportContactLine();
  const body = [
    `Your password at ${APP_NAME} was changed.`,
    "",
    `If you did not request or reset this password, please contact us immediately at ${support}.`,
    "",
    `You should also try to log in (${loginUrl}) and change your password to a stronger password in the Settings section of the application (${settingsUrl}).`,
    "",
    "This email contains no patient information.",
  ].join("\n");
  await sendDemoMessage({
    channel: "email",
    toAddress: input.toEmail,
    templateKey: "password_changed_no_phi",
    subject: `Your ${APP_NAME} password was changed`,
    body,
    toEmail: input.toEmail,
  });
}

export async function sendPracticeClaimEmail(input: {
  practiceId: string;
  practiceName: string;
  postalCode: string;
  adminEmail: string | null;
  claimantEmail: string;
  claimantName: string;
  note: string;
}): Promise<void> {
  const support = supportContactLine();
  const body = [
    `Practice claim / incorrect information report`,
    "",
    `Practice: ${input.practiceName}`,
    `ZIP: ${input.postalCode}`,
    `Practice ID: ${input.practiceId}`,
    `Listed admin email: ${input.adminEmail || "(none)"}`,
    "",
    `Claimant name: ${input.claimantName || "(not provided)"}`,
    `Claimant email: ${input.claimantEmail}`,
    "",
    `Note:`,
    input.note || "(none)",
    "",
    "Please review and help reclaim or correct this practice listing.",
    "This email contains no patient information.",
  ].join("\n");
  await sendDemoMessage({
    channel: "email",
    toAddress: support,
    templateKey: "practice_claim_no_phi",
    subject: `Practice claim request: ${input.practiceName} (${input.postalCode})`,
    body,
    toEmail: support,
  });
}
