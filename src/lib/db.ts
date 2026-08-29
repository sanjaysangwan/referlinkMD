import { billingFor, specialistHasAccess } from "./billing";
import { createSeed } from "./seed";
import type {
  AlertLog,
  AlertPreferences,
  Organization,
  Patient,
  Referral,
  Store,
  User,
} from "./types";

const globalForStore = globalThis as unknown as {
  __referlinkStore?: Store;
  __referlinkVersion?: number;
};

const STORE_VERSION = 5;

function getStore(): Store {
  if (!globalForStore.__referlinkStore || globalForStore.__referlinkVersion !== STORE_VERSION) {
    globalForStore.__referlinkStore = createSeed();
    globalForStore.__referlinkVersion = STORE_VERSION;
  }
  return globalForStore.__referlinkStore;
}

export const db = {
  store: getStore,
  reset() {
    globalForStore.__referlinkStore = createSeed();
    globalForStore.__referlinkVersion = STORE_VERSION;
    return globalForStore.__referlinkStore!;
  },
  users(): User[] {
    return getStore().users;
  },
  userById(id: string) {
    return getStore().users.find((u) => u.id === id) ?? null;
  },
  userByEmail(email: string) {
    return (
      getStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ??
      null
    );
  },
  organizations(): Organization[] {
    return getStore().organizations;
  },
  organizationById(id: string) {
    return getStore().organizations.find((o) => o.id === id) ?? null;
  },
  specialistOrganizations() {
    return getStore().organizations.filter((o) => o.type === "SPECIALIST");
  },
  openSpecialistOrganizations() {
    return this.specialistOrganizations().filter((o) => specialistHasAccess(billingFor(o)));
  },
  insertOrganization(org: Organization) {
    getStore().organizations.push(org);
    return org;
  },
  insertUser(user: User) {
    getStore().users.push(user);
    return user;
  },
  updateOrganization(id: string, patch: Partial<Organization>) {
    const store = getStore();
    const idx = store.organizations.findIndex((o) => o.id === id);
    if (idx < 0) return null;
    store.organizations[idx] = { ...store.organizations[idx], ...patch };
    return store.organizations[idx];
  },
  patientsForOrg(organizationId: string): Patient[] {
    return getStore().patients.filter((p) => p.pcpOrganizationId === organizationId);
  },
  patientById(id: string) {
    return getStore().patients.find((p) => p.id === id) ?? null;
  },
  referrals(): Referral[] {
    return getStore().referrals;
  },
  referralById(id: string) {
    return getStore().referrals.find((r) => r.id === id) ?? null;
  },
  referralsFromOrg(organizationId: string) {
    return getStore().referrals.filter((r) => r.referringOrganizationId === organizationId);
  },
  referralsToOrg(organizationId: string) {
    return getStore().referrals.filter((r) => r.specialistOrganizationId === organizationId);
  },
  insertReferral(referral: Referral) {
    getStore().referrals.unshift(referral);
    return referral;
  },
  updateReferral(id: string, patch: Partial<Referral>) {
    const store = getStore();
    const idx = store.referrals.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    store.referrals[idx] = {
      ...store.referrals[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return store.referrals[idx];
  },
  alerts(): AlertLog[] {
    return getStore().alerts;
  },
  alertsForOrg(organizationId: string) {
    return getStore().alerts.filter((a) => a.organizationId === organizationId);
  },
  alertsForReferral(referralId: string) {
    return getStore().alerts.filter((a) => a.referralId === referralId);
  },
  insertAlert(alert: AlertLog) {
    getStore().alerts.unshift(alert);
    return alert;
  },
  preferencesFor(userId: string): AlertPreferences {
    const store = getStore();
    let pref = store.alertPreferences.find((p) => p.userId === userId);
    if (!pref) {
      pref = {
        userId,
        smsEnabled: false,
        voiceEnabled: false,
        afterHoursVoice: false,
      };
      store.alertPreferences.push(pref);
    }
    return pref;
  },
  updatePreferences(userId: string, patch: Partial<AlertPreferences>) {
    const current = this.preferencesFor(userId);
    Object.assign(current, patch, { userId });
    return current;
  },
};
