import type { Db } from "./index";
import { eq } from "drizzle-orm";
import { users } from "./schema";
import * as schema from "./schema";
import { encryptSecret, hashPassword } from "@/lib/crypto";
import { DEMO_MFA_SECRET, DEMO_PASSWORD } from "@/lib/env";
import { practiceNameZipKey } from "@/lib/practice-identity";
import { SPECIALTY_CATALOG, SPECIALTY_IDS } from "@/lib/specialty-catalog";



const IDS = {
  northwell: "b1000000-0000-4000-8000-000000000011",
  catholic: "b1000000-0000-4000-8000-000000000012",
  stonyBrook: "b1000000-0000-4000-8000-000000000013",
  nyu: "b1000000-0000-4000-8000-000000000014",
  independent: "b1000000-0000-4000-8000-000000000015",
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

async function ensureSpecialtyCatalog(db: Db): Promise<void> {
  for (const specialty of SPECIALTY_CATALOG) {
    const [existing] = await db
      .select({ id: schema.specialties.id })
      .from(schema.specialties)
      .where(eq(schema.specialties.id, specialty.id))
      .limit(1);
    if (!existing) {
      await db.insert(schema.specialties).values({
        id: specialty.id,
        name: specialty.name,
        sortOrder: specialty.sortOrder,
        status: "active",
      });
    }
    for (const sub of specialty.subspecialties) {
      const [subExisting] = await db
        .select({ id: schema.specialtySubspecialties.id })
        .from(schema.specialtySubspecialties)
        .where(eq(schema.specialtySubspecialties.id, sub.id))
        .limit(1);
      if (!subExisting) {
        await db.insert(schema.specialtySubspecialties).values({
          id: sub.id,
          specialtyId: specialty.id,
          name: sub.name,
          sortOrder: sub.sortOrder,
        });
      }
    }
  }
}

export async function seedIfEmpty(db: Db): Promise<void> {
  const existing = await db.select({ id: users.id }).from(users).limit(1);
  if (existing.length) return;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const mfaSecretEncrypted = encryptSecret(DEMO_MFA_SECRET);
  const now = new Date();

  await ensureSpecialtyCatalog(db);

  function clinician(
    id: string,
    email: string,
    first: string,
    last: string,
    npi: string,
    phone: string,
    specialty?: { specialtyId: string; subspecialtyId?: string },
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
      mfaMethod: "totp" as const,
      mfaEnabledAt: now,
      mustChangePassword: false,
      status: "active" as const,
      failedLoginCount: 0,
      lastLoginAt: null,
      specialtyId: specialty?.specialtyId ?? null,
      subspecialtyId: specialty?.subspecialtyId ?? null,
    };
  }

  await db.insert(schema.users).values([
    clinician(IDS.elena, "elena@referlink.demo", "Elena", "Vasquez", "1234567890", "+15550100101", {
      specialtyId: SPECIALTY_IDS.cardiology,
      subspecialtyId: SPECIALTY_IDS.ep,
    }),
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
      mfaMethod: "totp" as const,
      mfaEnabledAt: now,
      mustChangePassword: false,
      status: "active",
      failedLoginCount: 0,
    },
    clinician(IDS.david, "david@referlink.demo", "David", "Okonkwo", "2234567890", "+15550100201", {
      specialtyId: SPECIALTY_IDS.orthopedicSurgery,
      subspecialtyId: SPECIALTY_IDS.handSurgery,
    }),
    clinician(IDS.amina, "amina@referlink.demo", "Amina", "Patel", "2234567891", "+15550100202"),
  ]);

  await db.insert(schema.healthSystems).values([
    { id: IDS.northwell, name: "Northwell Health", logo: letterLogo("N", "#0f4c81"), status: "active" },
    { id: IDS.catholic, name: "Catholic Health", logo: letterLogo("C", "#7c2d12"), status: "active" },
    { id: IDS.stonyBrook, name: "Stony Brook", logo: letterLogo("S", "#14532d"), status: "active" },
    { id: IDS.nyu, name: "NYU", logo: letterLogo("Y", "#570a0a"), status: "active" },
    { id: IDS.independent, name: "Independent", logo: letterLogo("I", "#334155"), status: "active" },
  ]);

  await db.insert(schema.practices).values([
    {
      id: IDS.harbor,
      healthSystemId: IDS.northwell,
      name: "Harbor Family Medicine",
      phone: "+15550100100",
      fax: "+15550100109",
      logo: letterLogo("H", "#115e59"),
      addressLine1: "100 Harbor Way",
      city: "Portland",
      state: "ME",
      postalCode: "04101",
      nameZipKey: practiceNameZipKey("Harbor Family Medicine", "04101"),
      timezone: "America/New_York",
      status: "active",
      createdByUserId: IDS.elena,
    },
    {
      id: IDS.riverside,
      healthSystemId: IDS.catholic,
      name: "Riverside Internal Medicine",
      phone: "+15550100200",
      fax: "+15550100209",
      logo: letterLogo("R", "#0f1c2e"),
      addressLine1: "40 Riverside Ave",
      city: "Portland",
      state: "ME",
      postalCode: "04102",
      nameZipKey: practiceNameZipKey("Riverside Internal Medicine", "04102"),
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

/** Fill fax/logo on demo practices; ensure catalog health systems exist with logos. */
export async function backfillPracticeProfile(db: Db): Promise<void> {
  const catalog = [
    { id: IDS.northwell, name: "Northwell Health", logo: letterLogo("N", "#0f4c81") },
    { id: IDS.catholic, name: "Catholic Health", logo: letterLogo("C", "#7c2d12") },
    { id: IDS.stonyBrook, name: "Stony Brook", logo: letterLogo("S", "#14532d") },
    { id: IDS.nyu, name: "NYU", logo: letterLogo("Y", "#570a0a") },
    { id: IDS.independent, name: "Independent", logo: letterLogo("I", "#334155") },
  ];
  for (const row of catalog) {
    const [existing] = await db
      .select({ id: schema.healthSystems.id, logo: schema.healthSystems.logo })
      .from(schema.healthSystems)
      .where(eq(schema.healthSystems.id, row.id))
      .limit(1);
    if (!existing) {
      await db.insert(schema.healthSystems).values({
        id: row.id,
        name: row.name,
        logo: row.logo,
        status: "active",
      });
      continue;
    }
    if (!existing.logo) {
      await db
        .update(schema.healthSystems)
        .set({ logo: row.logo, updatedAt: new Date() })
        .where(eq(schema.healthSystems.id, row.id));
    }
  }

  const demo = [
    {
      id: IDS.harbor,
      fax: "+15550100109",
      logo: letterLogo("H", "#115e59"),
      healthSystemId: IDS.northwell,
    },
    {
      id: IDS.riverside,
      fax: "+15550100209",
      logo: letterLogo("R", "#0f1c2e"),
      healthSystemId: IDS.catholic,
    },
  ];
  for (const row of demo) {
    const [practice] = await db
      .select({
        id: schema.practices.id,
        fax: schema.practices.fax,
        logo: schema.practices.logo,
        healthSystemId: schema.practices.healthSystemId,
      })
      .from(schema.practices)
      .where(eq(schema.practices.id, row.id))
      .limit(1);
    if (!practice) continue;
    const patch: {
      fax?: string;
      logo?: string;
      healthSystemId?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };
    if (!practice.fax) patch.fax = row.fax;
    if (!practice.logo) patch.logo = row.logo;
    if (
      practice.healthSystemId === "b1000000-0000-4000-8000-000000000001" ||
      practice.healthSystemId === "b1000000-0000-4000-8000-000000000010"
    ) {
      patch.healthSystemId = row.healthSystemId;
    }
    if (patch.fax || patch.logo || patch.healthSystemId) {
      await db.update(schema.practices).set(patch).where(eq(schema.practices.id, row.id));
    }
  }
}

/** Seed specialty catalog and assign demo physicians when missing. */
export async function backfillSpecialtyCatalog(db: Db): Promise<void> {
  await ensureSpecialtyCatalog(db);

  const demoPhysicians = [
    {
      id: IDS.elena,
      specialtyId: SPECIALTY_IDS.cardiology,
      subspecialtyId: SPECIALTY_IDS.ep,
    },
    {
      id: IDS.david,
      specialtyId: SPECIALTY_IDS.orthopedicSurgery,
      subspecialtyId: SPECIALTY_IDS.handSurgery,
    },
  ];
  for (const row of demoPhysicians) {
    const [user] = await db
      .select({
        id: schema.users.id,
        specialtyId: schema.users.specialtyId,
      })
      .from(schema.users)
      .where(eq(schema.users.id, row.id))
      .limit(1);
    if (!user || user.specialtyId) continue;
    await db
      .update(schema.users)
      .set({ specialtyId: row.specialtyId, subspecialtyId: row.subspecialtyId })
      .where(eq(schema.users.id, row.id));
  }
}
