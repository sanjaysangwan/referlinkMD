import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const specialties = pgTable(
  "specialties",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("specialties_name_idx").on(t.name)],
);

export const specialtySubspecialties = pgTable(
  "specialty_subspecialties",
  {
    id: uuid("id").primaryKey(),
    specialtyId: uuid("specialty_id")
      .notNull()
      .references(() => specialties.id),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("specialty_subspecialties_specialty_name_idx").on(t.specialtyId, t.name)],
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  npi: text("npi"),
  mobilePhone: text("mobile_phone"),
  mobileVerifiedAt: timestamp("mobile_verified_at", { withTimezone: true }),
  mfaSecretEncrypted: text("mfa_secret_encrypted"),
  mfaMethod: text("mfa_method").$type<"totp" | "sms">(),
  mfaSmsCodeHash: text("mfa_sms_code_hash"),
  mfaSmsCodeExpiresAt: timestamp("mfa_sms_code_expires_at", { withTimezone: true }),
  mfaEnabledAt: timestamp("mfa_enabled_at", { withTimezone: true }),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  status: text("status").notNull(),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  previousLoginAt: timestamp("previous_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  specialtyId: uuid("specialty_id").references(() => specialties.id),
  subspecialtyId: uuid("subspecialty_id").references(() => specialtySubspecialties.id),
});

export const healthSystems = pgTable("health_systems", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const practices = pgTable("practices", {
  id: uuid("id").primaryKey(),
  healthSystemId: uuid("health_system_id")
    .notNull()
    .references(() => healthSystems.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  fax: text("fax").notNull(),
  logo: text("logo"),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  nameZipKey: text("name_zip_key"),
  timezone: text("timezone").notNull().default("America/New_York"),
  status: text("status").notNull(),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const practiceMemberships = pgTable(
  "practice_memberships",
  {
    id: uuid("id").primaryKey(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull(),
    status: text("status").notNull(),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("practice_memberships_practice_user_idx").on(t.practiceId, t.userId),
    uniqueIndex("practice_memberships_one_active_user_idx")
      .on(t.userId)
      .where(sql`${t.status} = 'active'`),
  ],
);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey(),
  practiceId: uuid("practice_id")
    .notNull()
    .references(() => practices.id),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  tempPasswordHash: text("temp_password_hash"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  invitedByUserId: uuid("invited_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dob: date("dob", { mode: "string" }).notNull(),
    contactPhone: text("contact_phone").notNull(),
    isSynthetic: boolean("is_synthetic").notNull().default(true),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("patients_practice_identity_idx").on(
      t.practiceId,
      t.lastName,
      t.firstName,
      t.dob,
      t.contactPhone,
    ),
  ],
);

export const consults = pgTable("consults", {
  id: uuid("id").primaryKey(),
  requestingPracticeId: uuid("requesting_practice_id")
    .notNull()
    .references(() => practices.id),
  requestedByUserId: uuid("requested_by_user_id")
    .notNull()
    .references(() => users.id),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id),
  consultingName: text("consulting_name").notNull(),
  consultingPhone: text("consulting_phone").notNull(),
  consultingUserId: uuid("consulting_user_id").references(() => users.id),
  consultPriority: text("consult_priority").$type<"immediate" | "urgent" | "routine">().notNull().default("routine"),
  consultRequestComment: text("consult_request_comment"),
  consultAppointment: date("consult_appointment"),
  resolution: text("resolution").$type<"scheduled" | "declined">(),
  addressedByUserId: uuid("addressed_by_user_id").references(() => users.id),
  addressedAt: timestamp("addressed_at", { withTimezone: true }),
  consultResponseComment: text("consult_response_comment"),
  status: text("status").notNull(),
  firstViewedAt: timestamp("first_viewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accessTokens = pgTable("access_tokens", {
  id: uuid("id").primaryKey(),
  consultId: uuid("consult_id")
    .notNull()
    .references(() => consults.id),
  tokenHash: text("token_hash").notNull().unique(),
  consultingPhone: text("consulting_phone").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey(),
  consultId: uuid("consult_id").references(() => consults.id),
  channel: text("channel").notNull(),
  toPhone: text("to_phone"),
  toEmail: text("to_email"),
  templateKey: text("template_key").notNull(),
  providerMessageId: text("provider_message_id"),
  status: text("status").notNull(),
  errorCode: text("error_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().notNull(),
});

export const demoOutbox = pgTable("demo_outbox", {
  id: uuid("id").primaryKey(),
  channel: text("channel").notNull(),
  toAddress: text("to_address").notNull(),
  templateKey: text("template_key").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const favoriteConsultants = pgTable(
  "favorite_consultants",
  {
    id: uuid("id").primaryKey(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practices.id),
    consultantUserId: uuid("consultant_user_id")
      .notNull()
      .references(() => users.id),
    officePhone: text("office_phone"),
    addedByUserId: uuid("added_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favorite_consultants_practice_consultant_idx").on(t.practiceId, t.consultantUserId)],
);

export const favoriteConsultantStars = pgTable(
  "favorite_consultant_stars",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    consultantUserId: uuid("consultant_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("favorite_consultant_stars_user_consultant_idx").on(t.userId, t.consultantUserId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  memberships: many(practiceMemberships),
  favoriteStars: many(favoriteConsultantStars),
  specialty: one(specialties, { fields: [users.specialtyId], references: [specialties.id] }),
  subspecialty: one(specialtySubspecialties, {
    fields: [users.subspecialtyId],
    references: [specialtySubspecialties.id],
  }),
}));

export const specialtiesRelations = relations(specialties, ({ many }) => ({
  subspecialties: many(specialtySubspecialties),
  users: many(users),
}));

export const specialtySubspecialtiesRelations = relations(specialtySubspecialties, ({ one, many }) => ({
  specialty: one(specialties, {
    fields: [specialtySubspecialties.specialtyId],
    references: [specialties.id],
  }),
  users: many(users),
}));

export const healthSystemsRelations = relations(healthSystems, ({ many }) => ({
  practices: many(practices),
}));

export const practicesRelations = relations(practices, ({ one, many }) => ({
  healthSystem: one(healthSystems, {
    fields: [practices.healthSystemId],
    references: [healthSystems.id],
  }),
  memberships: many(practiceMemberships),
  patients: many(patients),
  consults: many(consults),
  favoriteConsultants: many(favoriteConsultants),
}));

export const practiceMembershipsRelations = relations(practiceMemberships, ({ one }) => ({
  practice: one(practices, { fields: [practiceMemberships.practiceId], references: [practices.id] }),
  user: one(users, { fields: [practiceMemberships.userId], references: [users.id] }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  practice: one(practices, { fields: [patients.practiceId], references: [practices.id] }),
  consults: many(consults),
}));

export const consultsRelations = relations(consults, ({ one }) => ({
  patient: one(patients, { fields: [consults.patientId], references: [patients.id] }),
  requestingPractice: one(practices, {
    fields: [consults.requestingPracticeId],
    references: [practices.id],
  }),
  requestedBy: one(users, { fields: [consults.requestedByUserId], references: [users.id] }),
  consultingUser: one(users, { fields: [consults.consultingUserId], references: [users.id] }),
}));

export const favoriteConsultantsRelations = relations(favoriteConsultants, ({ one }) => ({
  practice: one(practices, {
    fields: [favoriteConsultants.practiceId],
    references: [practices.id],
  }),
  consultant: one(users, {
    fields: [favoriteConsultants.consultantUserId],
    references: [users.id],
  }),
  addedBy: one(users, {
    fields: [favoriteConsultants.addedByUserId],
    references: [users.id],
  }),
}));

export const favoriteConsultantStarsRelations = relations(favoriteConsultantStars, ({ one }) => ({
  user: one(users, {
    fields: [favoriteConsultantStars.userId],
    references: [users.id],
  }),
  consultant: one(users, {
    fields: [favoriteConsultantStars.consultantUserId],
    references: [users.id],
  }),
}));
