import { eq, sql } from "drizzle-orm";
import { healthSystems } from "@/db/schema";
import type { Db } from "@/db";

/** Stable IDs for the demo / catalog health systems. */
export const HEALTH_SYSTEM_IDS = {
  northwell: "b1000000-0000-4000-8000-000000000011",
  catholic: "b1000000-0000-4000-8000-000000000012",
  stonyBrook: "b1000000-0000-4000-8000-000000000013",
  nyu: "b1000000-0000-4000-8000-000000000014",
  independent: "b1000000-0000-4000-8000-000000000015",
} as const;

export const CATALOG_HEALTH_SYSTEMS: Array<{ id: string; name: string }> = [
  { id: HEALTH_SYSTEM_IDS.northwell, name: "Northwell Health" },
  { id: HEALTH_SYSTEM_IDS.catholic, name: "Catholic Health" },
  { id: HEALTH_SYSTEM_IDS.stonyBrook, name: "Stony Brook" },
  { id: HEALTH_SYSTEM_IDS.nyu, name: "NYU" },
  { id: HEALTH_SYSTEM_IDS.independent, name: "Independent" },
];

export async function findHealthSystemByName(db: Db, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const [row] = await db
    .select()
    .from(healthSystems)
    .where(sql`lower(${healthSystems.name}) = lower(${trimmed})`)
    .limit(1);
  return row ?? null;
}

export async function ensureIndependentHealthSystem(db: Db): Promise<string> {
  const existing = await findHealthSystemByName(db, "Independent");
  if (existing) return existing.id;
  await db.insert(healthSystems).values({
    id: HEALTH_SYSTEM_IDS.independent,
    name: "Independent",
    status: "active",
  });
  return HEALTH_SYSTEM_IDS.independent;
}

/** Assign an existing catalog/custom health system by id or name. Logos are system-managed only. */
export async function resolveOrCreateHealthSystem(
  db: Db,
  input: { healthSystemId?: string | null; healthSystemName?: string | null },
): Promise<string> {
  if (input.healthSystemId) {
    const [row] = await db
      .select({ id: healthSystems.id })
      .from(healthSystems)
      .where(eq(healthSystems.id, input.healthSystemId))
      .limit(1);
    if (!row) throw new Error("Health system not found.");
    return row.id;
  }
  const name = input.healthSystemName?.trim();
  if (!name) throw new Error("Choose or enter a health system.");
  const existing = await findHealthSystemByName(db, name);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  await db.insert(healthSystems).values({
    id,
    name,
    logo: null,
    status: "active",
  });
  return id;
}
