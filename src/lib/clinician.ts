import { and, eq, isNull } from "drizzle-orm";
import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import { consults, patients, users } from "@/db/schema";
import { getDb } from "@/db";
import { encryptSecret } from "./crypto";
import { APP_NAME } from "./brand";
import { appEnv } from "./env";

export function assertSyntheticPatientWrite(isSynthetic: boolean): void {
  const env = appEnv();
  if (env === "demo" && !isSynthetic) {
    throw new Error("Demo environment only accepts synthetic patients.");
  }
  if (env === "production" && isSynthetic) {
    throw new Error("Production environment cannot write synthetic patients.");
  }
}

export async function findActiveUserByPhone(phone: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.mobilePhone, phone), eq(users.status, "active")))
    .limit(1);
  return row ?? null;
}

function normalizeClinicianName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(md|do|np|pa|pa-c|app|rn)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve the consulting clinician by mobile, then NPI, then unique name. */
export async function findConsultingClinician(input: {
  phone: string;
  npi?: string | null;
  name: string;
}) {
  const byPhone = await findActiveUserByPhone(input.phone);
  if (byPhone) return byPhone;

  const db = await getDb();
  const npi = input.npi?.trim();
  if (npi && npiValid(npi)) {
    const [byNpi] = await db
      .select()
      .from(users)
      .where(and(eq(users.npi, npi), eq(users.status, "active")))
      .limit(1);
    if (byNpi) return byNpi;
  }

  const wanted = normalizeClinicianName(input.name);
  if (!wanted) return null;
  const actives = await db.select().from(users).where(eq(users.status, "active"));
  const matches = actives.filter(
    (u) => normalizeClinicianName(`${u.firstName} ${u.lastName}`) === wanted && u.mobilePhone,
  );
  return matches.length === 1 ? matches[0] : null;
}

export async function bindConsultsToUser(userId: string, phone: string): Promise<void> {
  const db = await getDb();
  await db
    .update(consults)
    .set({
      consultingUserId: userId,
      status: "awaiting_view",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(consults.consultingPhone, phone),
        isNull(consults.consultingUserId),
        eq(consults.status, "pending_consultant"),
      ),
    );
}

export async function upsertPatient(input: {
  practiceId: string;
  createdByUserId: string;
  firstName: string;
  lastName: string;
  dob: string;
  contactPhone: string;
}): Promise<{ id: string }> {
  assertSyntheticPatientWrite(true);
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(patients)
    .where(
      and(
        eq(patients.practiceId, input.practiceId),
        eq(patients.lastName, input.lastName),
        eq(patients.firstName, input.firstName),
        eq(patients.dob, input.dob),
        eq(patients.contactPhone, input.contactPhone),
      ),
    )
    .limit(1);
  if (existing) return { id: existing.id };
  const id = crypto.randomUUID();
  await db.insert(patients).values({
    id,
    practiceId: input.practiceId,
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob,
    contactPhone: input.contactPhone,
    isSynthetic: true,
    createdByUserId: input.createdByUserId,
  });
  return { id };
}

export function newTotp(secretBase32?: string): TOTP {
  return new TOTP({
    issuer: APP_NAME,
    label: APP_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secretBase32 ? Secret.fromBase32(secretBase32) : new Secret(),
  });
}

export async function totpQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 180 });
}

export function encryptTotpSecret(base32: string): string {
  return encryptSecret(base32);
}

export function npiValid(npi: string): boolean {
  return /^\d{10}$/.test(npi);
}
