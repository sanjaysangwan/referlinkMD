import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DEFAULT_DB_PATH = join(process.cwd(), "data", "referlinkmd.db");

function resolveDbPath() {
  const raw = process.env.DATABASE_URL?.trim() || "";
  if (!raw || raw.startsWith("file:")) {
    const file = raw.replace(/^file:/, "") || DEFAULT_DB_PATH;
    return isAbsolute(file) ? file : join(process.cwd(), file);
  }
  if (raw.startsWith("postgres")) {
    throw new Error(
      "Postgres DATABASE_URL is not wired in this slice. Use a SQLite file URL (file:./data/referlinkmd.db) or leave DATABASE_URL empty.",
    );
  }
  return isAbsolute(raw) ? raw : join(process.cwd(), raw);
}

function openSqlite() {
  const path = resolveDbPath();
  mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return sqlite;
}

const sqlite = openSqlite();
export const drizzleDb = drizzle(sqlite, { schema });

function createTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS organization (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      specialty TEXT,
      city TEXT NOT NULL,
      phone TEXT NOT NULL,
      subscription_status TEXT NOT NULL,
      trial_ends_at TEXT,
      subscribed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      credentials TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS session_userId_idx ON session(user_id);

    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      issuer TEXT NOT NULL,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS account_issuer_accountId_uidx ON account(issuer, account_id);
    CREATE INDEX IF NOT EXISTS account_userId_idx ON account(user_id);

    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);

    CREATE TABLE IF NOT EXISTS patient (
      id TEXT PRIMARY KEY,
      mrn TEXT NOT NULL,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      sex TEXT NOT NULL,
      pcp_organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      pcp_user_id TEXT NOT NULL REFERENCES user(id),
      insurance TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS patient_org_mrn_uidx ON patient(pcp_organization_id, mrn);

    CREATE TABLE IF NOT EXISTS referral (
      id TEXT PRIMARY KEY,
      display_id TEXT NOT NULL UNIQUE,
      patient_id TEXT NOT NULL REFERENCES patient(id),
      referring_user_id TEXT NOT NULL REFERENCES user(id),
      referring_organization_id TEXT NOT NULL REFERENCES organization(id),
      specialist_organization_id TEXT NOT NULL REFERENCES organization(id),
      assigned_specialist_user_id TEXT REFERENCES user(id),
      specialty TEXT NOT NULL,
      reason TEXT NOT NULL,
      clinical_summary TEXT NOT NULL DEFAULT '',
      urgency TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      accepted_at TEXT,
      scheduled_at TEXT
    );

    CREATE TABLE IF NOT EXISTS alert_log (
      id TEXT PRIMARY KEY,
      referral_id TEXT NOT NULL REFERENCES referral(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
      recipient_user_id TEXT NOT NULL REFERENCES user(id),
      channel TEXT NOT NULL,
      "to" TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      provider TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_preference (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      sms_enabled INTEGER NOT NULL DEFAULT 0,
      voice_enabled INTEGER NOT NULL DEFAULT 0,
      after_hours_voice INTEGER NOT NULL DEFAULT 0
    );
  `);
}

let ready: Promise<void> | null = null;

export async function ensureDatabase() {
  if (!ready) {
    ready = (async () => {
      createTables();
      const row = sqlite.prepare("SELECT COUNT(*) as value FROM organization").get() as {
        value: number;
      };
      if (!row || row.value === 0) {
        const { persistSeed } = await import("./seed");
        await persistSeed(drizzleDb);
      }
    })();
  }
  return ready;
}

export function getSqlite() {
  return sqlite;
}
