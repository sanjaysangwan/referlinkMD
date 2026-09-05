export type PracticeRole = "physician" | "app" | "office_manager";

export type UserStatus = "invited" | "active" | "disabled";

export type MembershipStatus = "invited" | "active" | "revoked";

export type ConsultStatus =
  | "pending_consultant"
  | "awaiting_view"
  | "viewed"
  | "declined"
  | "completed"
  | "expired";

export type AuditAction =
  | "login_success"
  | "login_failure"
  | "consult_created"
  | "consult_viewed"
  | "patient_viewed"
  | "invite_sent"
  | "account_created"
  | "practice_updated"
  | "sms_sent"
  | "role_changed"
  | "token_consumed"
  | "password_changed"
  | "mfa_enabled";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  npi: string | null;
  mobilePhone: string | null;
  practiceId: string | null;
  practiceName: string | null;
  practiceLogo: string | null;
  role: PracticeRole | null;
  isPracticeCreator: boolean;
  mustChangePassword: boolean;
  mfaEnabled: boolean;
}

export type Privilege =
  | "createConsult"
  | "viewPatientIdentifiers"
  | "manageUsers"
  | "viewPracticeQueue"
  | "viewConsultingInbox";
