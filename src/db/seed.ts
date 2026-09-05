import type { Db } from "./index";
import { eq } from "drizzle-orm";
import { users } from "./schema";
import * as schema from "./schema";
import { encryptSecret, hashPassword } from "@/lib/crypto";
import { DEMO_MFA_SECRET, DEMO_PASSWORD } from "@/lib/env";



const IDS = {
  harbor: "a1000000-0000-4000-8000-000000000001",
  riverside: "a1000000-0000-4000-8000-000000000002",
  elena: "a2000000-0000-4000-8000-000000000001",
  jordan: "a2000000-0000-4000-8000-000000000002",
  priya: "a2000000-0000-4000-8000-000000000003",
  david: "a2000000-0000-4000-8000-000000000004",
  amina: "a2000000-0000-4000-8000-000000000005",
  memElena: "a3000000-0000-4000-8000-000000000001",
  memJordan: "a3000000-0000-4000-8000-000000000002",
  memPriya: "a3000000-0000-4000-8000-000000000003",
  memDavid: "a3000000-0000-4000-8000-000000000004",
  memAmina: "a3000000-0000-4000-8000-000000000005",
  pAlex: "a4000000-0000-4000-8000-000000000001",
  pSamir: "a4000000-0000-4000-8000-000000000002",
  pNora: "a4000000-0000-4000-8000-000000000003",
  consultDavid: "a5000000-0000-4000-8000-000000000001",
};

function letterLogo(letter: string, background: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${background}"/><text x="32" y="42" text-anchor="middle" font-size="28" font-family="Georgia,serif" fill="#fffdf8">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function seedIfEmpty(db: Db): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) return;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const mfaSecretEncrypted = encryptSecret(DEMO_MFA_SECRET);
  const now = new Date();

  function clinician(
    id: string,
    email: string,
    first: string,
    last: string,
    npi: string,
    phone: string,
  ) {
    return {
      id,
      email,
      passwordHash,
      firstName: first,
      lastName: last,
      npi,
      mobilePhone: phone,
      mobileVerifiedAt: now,
      mfaSecretEncrypted,
      mfaEnabledAt: now,
      mustChangePassword: false,
      status: "active" as const,
      failedLoginCount: 0,
      lastLoginAt: null,
    };
  }

  await db.insert(schema.users).values([
    clinician(IDS.elena, "elena@referlink.demo", "Elena", "Vasquez", "1234567890", "+15550100101"),
    clinician(IDS.jordan, "jordan@referlink.demo", "Jordan", "Hale", "1234567891", "+15550100102"),
    {
      id: IDS.priya,
      email: "priya@referlink.demo",
      passwordHash,
      firstName: "Priya",
      lastName: "Shah",
      npi: null,
      mobilePhone: null,
      mobileVerifiedAt: null,
      mfaSecretEncrypted,
      mfaEnabledAt: now,
      mustChangePassword: false,
      status: "active",
      failedLoginCount: 0,
    },
    clinician(IDS.david, "david@referlink.demo", "David", "Okonkwo", "2234567890", "+15550100201"),
    clinician(IDS.amina, "amina@referlink.demo", "Amina", "Patel", "2234567891", "+15550100202"),
  ]);

  await db.insert(schema.practices).values([
    {
      id: IDS.harbor,
      name: "Harbor Family Medicine",
      phone: "+15550100100",
      fax: "+15550100109",
      logo: letterLogo("H", "#115e59"),
      addressLine1: "100 Harbor Way",
      city: "Portland",
      state: "ME",
      postalCode: "04101",
      timezone: "America/New_York",
      status: "active",
      createdByUserId: IDS.elena,
    },
    {
      id: IDS.riverside,
      name: "Riverside Internal Medicine",
      phone: "+15550100200",
      fax: "+15550100209",
      logo: letterLogo("R", "#0f1c2e"),
      addressLine1: "40 Riverside Ave",
      city: "Portland",
      state: "ME",
      postalCode: "04102",
      timezone: "America/New_York",
      status: "active",
      createdByUserId: IDS.david,
    },
  ]);

  await db.insert(schema.practiceMemberships).values([
    {
      id: IDS.memElena,
      practiceId: IDS.harbor,
      userId: IDS.elena,
      role: "physician",
      status: "active",
      acceptedAt: now,
    },
    {
      id: IDS.memJordan,
      practiceId: IDS.harbor,
      userId: IDS.jordan,
      role: "app",
      status: "active",
      invitedByUserId: IDS.elena,
      acceptedAt: now,
    },
    {
      id: IDS.memPriya,
      practiceId: IDS.harbor,
      userId: IDS.priya,
      role: "office_manager",
      status: "active",
      invitedByUserId: IDS.elena,
      acceptedAt: now,
    },
    {
      id: IDS.memDavid,
      practiceId: IDS.riverside,
      userId: IDS.david,
      role: "physician",
      status: "active",
      acceptedAt: now,
    },
    {
      id: IDS.memAmina,
      practiceId: IDS.riverside,
      userId: IDS.amina,
      role: "app",
      status: "active",
      invitedByUserId: IDS.david,
      acceptedAt: now,
    },
  ]);

  await db.insert(schema.patients).values([
    {
      id: IDS.pAlex,
      practiceId: IDS.harbor,
      firstName: "Alex",
      lastName: "Rivera",
      dob: "1968-03-12",
      contactPhone: "+15550110001",
      isSynthetic: true,
      createdByUserId: IDS.elena,
    },
    {
      id: IDS.pSamir,
      practiceId: IDS.harbor,
      firstName: "Samir",
      lastName: "Qureshi",
      dob: "1975-11-02",
      contactPhone: "+15550110002",
      isSynthetic: true,
      createdByUserId: IDS.elena,
    },
    {
      id: IDS.pNora,
      practiceId: IDS.riverside,
      firstName: "Nora",
      lastName: "Lindqvist",
      dob: "1982-07-19",
      contactPhone: "+15550110003",
      isSynthetic: true,
      createdByUserId: IDS.david,
    },
  ]);

  await db.insert(schema.consults).values({
    id: IDS.consultDavid,
    requestingPracticeId: IDS.harbor,
    requestedByUserId: IDS.elena,
    patientId: IDS.pAlex,
    consultingName: "David Okonkwo, MD",
    consultingPhone: "+15550100201",
    consultingUserId: IDS.david,
    status: "awaiting_view",
  });
}

/** Fill fax/logo on demo practices created before those columns existed. */
export async function backfillPracticeProfile(db: Db): Promise<void> {
  const demo = [
    {
      id: IDS.harbor,
      fax: "+15550100109",
      logo: letterLogo("H", "#115e59"),
    },
    {
      id: IDS.riverside,
      fax: "+15550100209",
      logo: letterLogo("R", "#0f1c2e"),
    },
  ];
  for (const row of demo) {
    const [practice] = await db
      .select({ id: schema.practices.id, fax: schema.practices.fax, logo: schema.practices.logo })
      .from(schema.practices)
      .where(eq(schema.practices.id, row.id))
      .limit(1);
    if (!practice) continue;
    if (practice.fax && practice.logo) continue;
    await db
      .update(schema.practices)
      .set({
        fax: practice.fax || row.fax,
        logo: practice.logo || row.logo,
        updatedAt: new Date(),
      })
      .where(eq(schema.practices.id, row.id));
  }
}
