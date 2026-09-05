import { mkdirSync } from "fs";
import { join } from "path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as localDrizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as postgresDrizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { MIGRATION_002_SQL, MIGRATION_003_SQL, MIGRATION_004_SQL, MIGRATION_005_SQL, MIGRATION_006_SQL, MIGRATION_007_SQL, MIGRATION_008_SQL, SCHEMA_SQL } from "./sql";
import { backfillPracticeProfile, seedIfEmpty } from "./seed";

export type Db = PgliteDatabase<typeof schema> | NodePgDatabase<typeof schema>;
const cache = globalThis as unknown as { referlinkReady?: Promise<Db> };
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

type Query = (sql: string, params?: string[]) => Promise<{ rows: Record<string, unknown>[] }>;
async function migrate(query: Query) {
  const existing = await query("SELECT to_regclass('users') AS users, to_regclass('schema_migrations') AS migrations");
  if (existing.rows[0]?.users && !existing.rows[0]?.migrations) {
    throw new Error("Existing database has an unrecognized schema. Use a new empty database or migrate the existing schema explicitly.");
  }
  await query("CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  if (!existing.rows[0]?.users) {
    await query(SCHEMA_SQL);
    for (const migration of migrations) {
      await query("INSERT INTO schema_migrations (id) VALUES ($1) ON CONFLICT DO NOTHING", [migration.id]);
    }
    return;
  }
  for (const migration of migrations) {
    const applied = await query("SELECT id FROM schema_migrations WHERE id=$1", [migration.id]);
    if (applied.rows.length) continue;
    await query(migration.sql);
    await query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration.id]);
  }
}

async function init(): Promise<Db> {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10000 });
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(741902)");
        await migrate(async (sql, params) => {
          const result = await client.query(sql, params);
          return Array.isArray(result) ? result[result.length - 1] : result;
        });
        const db = postgresDrizzle(client, { schema });
        if (process.env.SEED_DEMO_DATA === "true" && process.env.APP_ENV === "demo") {
          await seedIfEmpty(db);
          await backfillPracticeProfile(db);
        }
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      return postgresDrizzle(pool, { schema });
    } catch (error) {
      await pool.end();
      throw error;
    }
  }
  if (process.env.RAILWAY_PROJECT_ID || process.env.APP_ENV === "production") {
    throw new Error("DATABASE_URL is required for hosted deployments.");
  }
  const directory = join(process.cwd(), "data", "referlink");
  mkdirSync(directory, { recursive: true });
  const client = new PGlite(directory);
  try {
    await client.waitReady;
    await client.transaction(async (tx) => {
      await migrate(async (sql, params) => {
        if (params) return tx.query(sql, params);
        const results = await tx.exec(sql);
        return results[results.length - 1] ?? { rows: [] };
      });
    });
    const db = localDrizzle(client, { schema });
    await seedIfEmpty(db);
    await backfillPracticeProfile(db);
    return db;
  } catch (error) {
    await client.close();
    throw error;
  }
}
export async function getDb(): Promise<Db> {
  if (!cache.referlinkReady) {
    cache.referlinkReady = init().catch((error) => {
      cache.referlinkReady = undefined;
      throw error;
    });
  }
  return cache.referlinkReady;
}
