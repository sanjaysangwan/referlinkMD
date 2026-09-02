import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  specialty: text("specialty"),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  subscriptionStatus: text("subscription_status").notNull(),
  trialEndsAt: text("trial_ends_at"),
  subscribedAt: text("subscribed_at"),
});

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  credentials: text("credentials").notNull().default(""),
  phone: text("phone").notNull().default(""),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("account_issuer_accountId_uidx").on(table.issuer, table.accountId),
    index("account_userId_idx").on(table.userId),
  ],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const patient = sqliteTable(
  "patient",
  {
    id: text("id").primaryKey(),
    mrn: text("mrn").notNull(),
    name: text("name").notNull(),
    dob: text("dob").notNull(),
    sex: text("sex").notNull(),
    pcpOrganizationId: text("pcp_organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pcpUserId: text("pcp_user_id")
      .notNull()
      .references(() => user.id),
    insurance: text("insurance").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
    updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  },
  (table) => [uniqueIndex("patient_org_mrn_uidx").on(table.pcpOrganizationId, table.mrn)],
);

export const referral = sqliteTable("referral", {
  id: text("id").primaryKey(),
  displayId: text("display_id").notNull().unique(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patient.id),
  referringUserId: text("referring_user_id")
    .notNull()
    .references(() => user.id),
  referringOrganizationId: text("referring_organization_id")
    .notNull()
    .references(() => organization.id),
  specialistOrganizationId: text("specialist_organization_id")
    .notNull()
    .references(() => organization.id),
  assignedSpecialistUserId: text("assigned_specialist_user_id").references(() => user.id),
  specialty: text("specialty").notNull(),
  reason: text("reason").notNull(),
  clinicalSummary: text("clinical_summary").notNull().default(""),
  urgency: text("urgency").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  acceptedAt: text("accepted_at"),
  scheduledAt: text("scheduled_at"),
});

export const alertLog = sqliteTable("alert_log", {
  id: text("id").primaryKey(),
  referralId: text("referral_id")
    .notNull()
    .references(() => referral.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  recipientUserId: text("recipient_user_id")
    .notNull()
    .references(() => user.id),
  channel: text("channel").notNull(),
  to: text("to").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  provider: text("provider").notNull(),
});

export const alertPreference = sqliteTable("alert_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  smsEnabled: integer("sms_enabled", { mode: "boolean" }).notNull().default(false),
  voiceEnabled: integer("voice_enabled", { mode: "boolean" }).notNull().default(false),
  afterHoursVoice: integer("after_hours_voice", { mode: "boolean" }).notNull().default(false),
});
