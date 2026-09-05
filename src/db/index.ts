import { mkdirSync } from "fs";
import { join } from "path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { MIGRATION_002_SQL, MIGRATION_003_SQL, MIGRATION_004_SQL, MIGRATION_005_SQL, MIGRATION_006_SQL, MIGRATION_007_SQL, MIGRATION_008_SQL, SCHEMA_SQL } from "./sql";
import { backfillPracticeProfile, seedIfEmpty } from "./seed";

const DATA_DIR = join(process.cwd(), "data", "referlink");

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  referlinkPglite?: PGlite;
  referlinkDb?: Db;
  referlinkReady?: Promise<Db>;
};

async function init(): Promise<Db> {
  mkdirSync(DATA_DIR, { recursive: true });
  const client = globalForDb.referlinkPglite ?? new PGlite(DATA_DIR);
  globalForDb.referlinkPglite = client;
  await client.waitReady;
  const db = drizzle({ client, schema });
  globalForDb.referlinkDb = db;

  const migrations = [
    { id: "001", sql: SCHEMA_SQL },
    { id: "002", sql: MIGRATION_002_SQL },
    { id: "003", sql: MIGRATION_003_SQL },
    { id: "004", sql: MIGRATION_004_SQL },
    { id: "005", sql: MIGRATION_005_SQL },
    { id: "006", sql: MIGRATION_006_SQL },
    { id: "007", sql: MIGRATION_007_SQL },
    { id: "008", sql: MIGRATION_008_SQL },
  ];
  await client.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  for (const migration of migrations) {
    const applied = await client.query<{ id: string }>(
      `SELECT id FROM schema_migrations WHERE id = '${migration.id}' LIMIT 1`,
    );
    if (applied.rows?.length) continue;
    await client.exec(migration.sql);
    await client.query(
      `INSERT INTO schema_migrations (id) VALUES ('${migration.id}') ON CONFLICT (id) DO NOTHING`,
    );
  }

  await seedIfEmpty(db);
  await backfillPracticeProfile(db);
  return db;
}

export async function getDb(): Promise<Db> {
  if (globalForDb.referlinkDb) return globalForDb.referlinkDb;
  if (!globalForDb.referlinkReady) {
    globalForDb.referlinkReady = init().catch((err) => {
      globalForDb.referlinkReady = undefined;
      globalForDb.referlinkPglite = undefined;
      globalForDb.referlinkDb = undefined;
      throw err;
    });
  }
  return globalForDb.referlinkReady;
}
