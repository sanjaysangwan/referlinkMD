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
    body,
    toEmail: input.toEmail,
  });
}
