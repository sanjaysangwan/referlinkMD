import { desc, eq } from "drizzle-orm";
import { billingFor, specialistHasAccess } from "./billing";
import { drizzleDb, ensureDatabase } from "./database";
import {
  alertLog,
  alertPreference,
  organization,
  patient,
  referral,
  user,
} from "./schema";
import type {
  AlertLog,
  AlertPreferences,
  Organization,
  Patient,
  Referral,
  User,
} from "./types";

function asUser(row: typeof user.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    credentials: row.credentials,
    role: row.role as User["role"],
    organizationId: row.organizationId,
    phone: row.phone,
  };
}

function asOrg(row: typeof organization.$inferSelect): Organization {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Organization["type"],
    specialty: row.specialty ?? undefined,
    city: row.city,
    phone: row.phone,
    subscriptionStatus: row.subscriptionStatus as Organization["subscriptionStatus"],
    trialEndsAt: row.trialEndsAt ?? undefined,
    subscribedAt: row.subscribedAt ?? undefined,
  };
}

function asPatient(row: typeof patient.$inferSelect): Patient {
  return {
    id: row.id,
    mrn: row.mrn,
    name: row.name,
    dob: row.dob,
    sex: row.sex as Patient["sex"],
    pcpOrganizationId: row.pcpOrganizationId,
    pcpUserId: row.pcpUserId,
    insurance: row.insurance,
  };
}

function asReferral(row: typeof referral.$inferSelect): Referral {
  return {
    id: row.id,
    displayId: row.displayId,
    patientId: row.patientId,
    referringUserId: row.referringUserId,
    referringOrganizationId: row.referringOrganizationId,
    specialistOrganizationId: row.specialistOrganizationId,
    assignedSpecialistUserId: row.assignedSpecialistUserId ?? undefined,
    specialty: row.specialty,
    reason: row.reason,
    clinicalSummary: row.clinicalSummary,
    urgency: row.urgency as Referral["urgency"],
    status: row.status as Referral["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    acceptedAt: row.acceptedAt ?? undefined,
    scheduledAt: row.scheduledAt ?? undefined,
  };
}

function asAlert(row: typeof alertLog.$inferSelect): AlertLog {
  return {
    id: row.id,
    referralId: row.referralId,
    organizationId: row.organizationId,
    recipientUserId: row.recipientUserId,
    channel: row.channel as AlertLog["channel"],
    to: row.to,
    message: row.message,
    status: row.status as AlertLog["status"],
    createdAt: row.createdAt,
    provider: row.provider as AlertLog["provider"],
  };
}

export const db = {
  async ready() {
    await ensureDatabase();
  },
  users(): User[] {
    return drizzleDb.select().from(user).all().map(asUser);
  },
  userById(id: string) {
    const row = drizzleDb.select().from(user).where(eq(user.id, id)).get();
    return row ? asUser(row) : null;
  },
  userByEmail(email: string) {
    const row = drizzleDb
      .select()
      .from(user)
      .where(eq(user.email, email.toLowerCase()))
      .get();
    return row ? asUser(row) : null;
  },
  organizations(): Organization[] {
    return drizzleDb.select().from(organization).all().map(asOrg);
  },
  organizationById(id: string) {
    const row = drizzleDb.select().from(organization).where(eq(organization.id, id)).get();
    return row ? asOrg(row) : null;
  },
  specialistOrganizations() {
    return this.organizations().filter((o) => o.type === "SPECIALIST");
  },
  openSpecialistOrganizations() {
    return this.specialistOrganizations().filter((o) => specialistHasAccess(billingFor(o)));
  },
  insertOrganization(org: Organization) {
    drizzleDb.insert(organization).values(org).run();
    return org;
  },
  insertUser(member: User) {
    const now = new Date();
    drizzleDb
      .insert(user)
      .values({
        id: member.id,
        name: member.name,
        email: member.email,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        organizationId: member.organizationId,
        role: member.role,
        credentials: member.credentials,
        phone: member.phone,
      })
      .run();
    return member;
  },
  updateOrganization(id: string, patch: Partial<Organization>) {
    const current = this.organizationById(id);
    if (!current) return null;
    const next = { ...current, ...patch };
    drizzleDb
      .update(organization)
      .set({
        name: next.name,
        type: next.type,
        specialty: next.specialty,
        city: next.city,
        phone: next.phone,
        subscriptionStatus: next.subscriptionStatus,
        trialEndsAt: next.trialEndsAt,
        subscribedAt: next.subscribedAt,
      })
      .where(eq(organization.id, id))
      .run();
    return next;
  },
  patientsForOrg(organizationId: string): Patient[] {
    return drizzleDb
      .select()
      .from(patient)
      .where(eq(patient.pcpOrganizationId, organizationId))
      .all()
      .map(asPatient);
  },
  patientById(id: string) {
    const row = drizzleDb.select().from(patient).where(eq(patient.id, id)).get();
    return row ? asPatient(row) : null;
  },
  insertPatient(person: Patient) {
    const now = new Date().toISOString();
    drizzleDb
      .insert(patient)
      .values({ ...person, createdAt: now, updatedAt: now })
      .run();
    return person;
  },
  referrals(): Referral[] {
    return drizzleDb.select().from(referral).orderBy(desc(referral.createdAt)).all().map(asReferral);
  },
  referralById(id: string) {
    const row = drizzleDb.select().from(referral).where(eq(referral.id, id)).get();
    return row ? asReferral(row) : null;
  },
  referralsFromOrg(organizationId: string) {
    return drizzleDb
      .select()
      .from(referral)
      .where(eq(referral.referringOrganizationId, organizationId))
      .orderBy(desc(referral.createdAt))
      .all()
      .map(asReferral);
  },
  referralsToOrg(organizationId: string) {
    return drizzleDb
      .select()
      .from(referral)
      .where(eq(referral.specialistOrganizationId, organizationId))
      .orderBy(desc(referral.createdAt))
      .all()
      .map(asReferral);
  },
  insertReferral(item: Referral) {
    drizzleDb.insert(referral).values(item).run();
    return item;
  },
  updateReferral(id: string, patch: Partial<Referral>) {
    const current = this.referralById(id);
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    drizzleDb
      .update(referral)
      .set({
        assignedSpecialistUserId: next.assignedSpecialistUserId,
        specialty: next.specialty,
        reason: next.reason,
        clinicalSummary: next.clinicalSummary,
        urgency: next.urgency,
        status: next.status,
        updatedAt: next.updatedAt,
        acceptedAt: next.acceptedAt,
        scheduledAt: next.scheduledAt,
      })
      .where(eq(referral.id, id))
      .run();
    return next;
  },
  alerts(): AlertLog[] {
    return drizzleDb.select().from(alertLog).orderBy(desc(alertLog.createdAt)).all().map(asAlert);
  },
  alertsForOrg(organizationId: string) {
    return drizzleDb
      .select()
      .from(alertLog)
      .where(eq(alertLog.organizationId, organizationId))
      .orderBy(desc(alertLog.createdAt))
      .all()
      .map(asAlert);
  },
  alertsForReferral(referralId: string) {
    return drizzleDb
      .select()
      .from(alertLog)
      .where(eq(alertLog.referralId, referralId))
      .orderBy(desc(alertLog.createdAt))
      .all()
      .map(asAlert);
  },
  insertAlert(item: AlertLog) {
    drizzleDb.insert(alertLog).values(item).run();
    return item;
  },
  preferencesFor(userId: string): AlertPreferences {
    const row = drizzleDb
      .select()
      .from(alertPreference)
      .where(eq(alertPreference.userId, userId))
      .get();
    if (row) return row;
    const pref: AlertPreferences = {
      userId,
      smsEnabled: false,
      voiceEnabled: false,
      afterHoursVoice: false,
    };
    drizzleDb.insert(alertPreference).values(pref).run();
    return pref;
  },
  updatePreferences(userId: string, patch: Partial<AlertPreferences>) {
    const current = this.preferencesFor(userId);
    const next = { ...current, ...patch, userId };
    drizzleDb
      .update(alertPreference)
      .set({
        smsEnabled: next.smsEnabled,
        voiceEnabled: next.voiceEnabled,
        afterHoursVoice: next.afterHoursVoice,
      })
      .where(eq(alertPreference.userId, userId))
      .run();
    return next;
  },
};
