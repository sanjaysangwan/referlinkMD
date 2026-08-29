export type OrgType = "PCP" | "SPECIALIST";

export type Role = "MD" | "MIDLEVEL" | "OFFICE_MANAGER" | "STAFF";

export type Urgency = "ROUTINE" | "SOON" | "URGENT";

export type ReferralStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "ALERTED"
  | "ACCEPTED"
  | "SCHEDULED"
  | "COMPLETED"
  | "DECLINED";

export type AlertChannel = "SMS" | "VOICE";

export type AlertDeliveryStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED";

export type Privilege =
  | "CREATE_REFERRAL"
  | "VIEW_CLINICAL"
  | "VIEW_ANALYTICS"
  | "VIEW_PRACTICE_ANALYTICS"
  | "MANAGE_TEAM"
  | "MANAGE_ALERTS"
  | "ACCEPT_REFERRAL"
  | "SCHEDULE_REFERRAL"
  | "VIEW_ALERT_LOG";

export type Organization = {
  id: string;
  name: string;
  type: OrgType;
  specialty?: string;
  city: string;
  phone: string;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  credentials: string;
  role: Role;
  organizationId: string;
  phone: string;
};

export type AlertPreferences = {
  userId: string;
  smsEnabled: boolean;
  voiceEnabled: boolean;
  afterHoursVoice: boolean;
};

export type Patient = {
  id: string;
  mrn: string;
  name: string;
  dob: string;
  sex: "F" | "M";
  pcpOrganizationId: string;
  pcpUserId: string;
  insurance: string;
};

export type Referral = {
  id: string;
  displayId: string;
  patientId: string;
  referringUserId: string;
  referringOrganizationId: string;
  specialistOrganizationId: string;
  assignedSpecialistUserId?: string;
  specialty: string;
  reason: string;
  clinicalSummary: string;
  urgency: Urgency;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  scheduledAt?: string;
};

export type AlertLog = {
  id: string;
  referralId: string;
  organizationId: string;
  recipientUserId: string;
  channel: AlertChannel;
  to: string;
  message: string;
  status: AlertDeliveryStatus;
  createdAt: string;
  provider: "mock" | "twilio";
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  credentials: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  organizationType: OrgType;
  specialty?: string;
  phone: string;
  privileges: Privilege[];
};

export type Store = {
  organizations: Organization[];
  users: User[];
  patients: Patient[];
  referrals: Referral[];
  alerts: AlertLog[];
  alertPreferences: AlertPreferences[];
};
