import { and, eq } from "drizzle-orm";
import { specialties, specialtySubspecialties } from "@/db/schema";
import type { Db } from "@/db";
import { physicianSpecialtyLabel } from "@/lib/specialty-catalog";

export { physicianSpecialtyLabel, SPECIALTY_CATALOG, SPECIALTY_IDS } from "@/lib/specialty-catalog";

export async function validatePhysicianSpecialty(
  db: Db,
  input: { specialtyId: string | null; subspecialtyId: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.specialtyId) {
    if (input.subspecialtyId) {
      return { ok: false, error: "Choose a specialty before a subspecialty." };
    }
    return { ok: true };
  }
  const [spec] = await db
    .select({ id: specialties.id })
    .from(specialties)
    .where(and(eq(specialties.id, input.specialtyId), eq(specialties.status, "active")))
    .limit(1);
  if (!spec) return { ok: false, error: "Specialty not found." };
  if (!input.subspecialtyId) return { ok: true };
  const [sub] = await db
    .select({ id: specialtySubspecialties.id })
    .from(specialtySubspecialties)
    .where(
      and(
        eq(specialtySubspecialties.id, input.subspecialtyId),
        eq(specialtySubspecialties.specialtyId, input.specialtyId),
      ),
    )
    .limit(1);
  if (!sub) return { ok: false, error: "Subspecialty must belong to the selected specialty." };
  return { ok: true };
}

export async function resolveSpecialtyLabel(
  db: Db,
  specialtyId: string | null | undefined,
  subspecialtyId: string | null | undefined,
): Promise<{
  specialtyName: string | null;
  subspecialtyName: string | null;
  specialtyLabel: string | null;
}> {
  let specialtyName: string | null = null;
  let subspecialtyName: string | null = null;
  if (specialtyId) {
    const [spec] = await db
      .select({ name: specialties.name })
      .from(specialties)
      .where(eq(specialties.id, specialtyId))
      .limit(1);
    specialtyName = spec?.name ?? null;
  }
  if (subspecialtyId) {
    const [sub] = await db
      .select({ name: specialtySubspecialties.name })
      .from(specialtySubspecialties)
      .where(eq(specialtySubspecialties.id, subspecialtyId))
      .limit(1);
    subspecialtyName = sub?.name ?? null;
  }
  return {
    specialtyName,
    subspecialtyName,
    specialtyLabel: physicianSpecialtyLabel({ specialtyName, subspecialtyName }),
  };
}
