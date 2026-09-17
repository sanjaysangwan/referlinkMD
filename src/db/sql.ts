/** PostgreSQL DDL used by the local PGlite POC and portable to RDS/Azure. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  npi text,
  mobile_phone text,
  mobile_verified_at timestamptz,
  mfa_secret_encrypted text,
  mfa_method text CHECK (mfa_method IS NULL OR mfa_method IN ('totp', 'sms')),
  mfa_sms_code_hash text,
  mfa_sms_code_expires_at timestamptz,
  mfa_enabled_at timestamptz,
  must_change_password boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (status IN ('invited', 'active', 'disabled')),
  failed_login_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  previous_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_phone_unique
  ON users (mobile_phone)
  WHERE mobile_phone IS NOT NULL AND length(btrim(mobile_phone)) > 0;

CREATE TABLE IF NOT EXISTS specialties (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS specialty_subspecialties (
  id uuid PRIMARY KEY,
  specialty_id uuid NOT NULL REFERENCES specialties(id),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (specialty_id, name)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES specialties(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subspecialty_id uuid REFERENCES specialty_subspecialties(id);

CREATE TABLE IF NOT EXISTS health_systems (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  logo text,
  status text NOT NULL CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practices (
  id uuid PRIMARY KEY,
  health_system_id uuid NOT NULL REFERENCES health_systems(id),
  name text NOT NULL,
  phone text NOT NULL,
  fax text NOT NULL,
  logo text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  name_zip_key text,
  timezone text NOT NULL DEFAULT 'America/New_York',
  status text NOT NULL CHECK (status IN ('active', 'suspended')),
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practice_memberships (
  id uuid PRIMARY KEY,
  practice_id uuid NOT NULL REFERENCES practices(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('physician', 'app', 'office_manager')),
  status text NOT NULL CHECK (status IN ('invited', 'active', 'revoked')),
  invited_by_user_id uuid REFERENCES users(id),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS practice_memberships_one_active_user_idx
  ON practice_memberships (user_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY,
  practice_id uuid NOT NULL REFERENCES practices(id),
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('physician', 'app', 'office_manager')),
  token_hash text NOT NULL UNIQUE,
  temp_password_hash text,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY,
  practice_id uuid NOT NULL REFERENCES practices(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date NOT NULL,
  contact_phone text NOT NULL,
  is_synthetic boolean NOT NULL DEFAULT true,
  created_by_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS patients_practice_identity_idx
  ON patients (practice_id, last_name, first_name, dob, contact_phone);

CREATE TABLE IF NOT EXISTS consults (
  id uuid PRIMARY KEY,
  requesting_practice_id uuid NOT NULL REFERENCES practices(id),
  requested_by_user_id uuid NOT NULL REFERENCES users(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consulting_name text NOT NULL,
  consulting_phone text NOT NULL,
  consulting_user_id uuid REFERENCES users(id),
  consult_priority text NOT NULL DEFAULT 'routine' CHECK (consult_priority IN ('immediate', 'urgent', 'routine')),
  consult_request_comment text,
  consult_appointment date,
  resolution text CHECK (resolution IN ('scheduled', 'declined')),
  addressed_by_user_id uuid REFERENCES users(id),
  addressed_at timestamptz,
  consult_response_comment text,
  CONSTRAINT consults_resolution_details_check CHECK (
    (resolution IS NULL AND addressed_by_user_id IS NULL AND addressed_at IS NULL)
    OR
    (resolution IS NOT NULL AND addressed_by_user_id IS NOT NULL AND addressed_at IS NOT NULL
      AND (
        (resolution = 'scheduled' AND consult_appointment IS NOT NULL)
        OR
        (resolution = 'declined' AND consult_response_comment IS NOT NULL
          AND length(btrim(consult_response_comment)) > 0)
      ))
  ),
  status text NOT NULL CHECK (
    status IN ('pending_consultant', 'awaiting_view', 'viewed', 'declined', 'completed', 'expired')
  ),
  first_viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consults_requesting_practice_idx ON consults (requesting_practice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS consults_consulting_phone_idx ON consults (consulting_phone);
CREATE INDEX IF NOT EXISTS consults_consulting_user_idx ON consults (consulting_user_id);

CREATE TABLE IF NOT EXISTS access_tokens (
  id uuid PRIMARY KEY,
  consult_id uuid NOT NULL REFERENCES consults(id),
  token_hash text NOT NULL UNIQUE,
  consulting_phone text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY,
  consult_id uuid REFERENCES consults(id),
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  to_phone text,
  to_email text,
  template_key text NOT NULL,
  provider_message_id text,
  status text NOT NULL CHECK (status IN ('queued', 'sent', 'failed')),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip text,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS audit_events_occurred_idx ON audit_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_actor_idx ON audit_events (actor_user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS demo_outbox (
  id uuid PRIMARY KEY,
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  to_address text NOT NULL,
  template_key text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorite_consultants (
  id uuid PRIMARY KEY,
  practice_id uuid NOT NULL REFERENCES practices(id),
  consultant_user_id uuid NOT NULL REFERENCES users(id),
  office_phone text,
  added_by_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_id, consultant_user_id)
);

CREATE TABLE IF NOT EXISTS favorite_consultant_stars (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  consultant_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, consultant_user_id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id, created_at DESC);
`;

/** Health systems above practices; one active membership per user. */
export const MIGRATION_014_SQL = `
CREATE TABLE IF NOT EXISTS health_systems (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  logo text,
  status text NOT NULL CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE practices ADD COLUMN IF NOT EXISTS health_system_id uuid REFERENCES health_systems(id);

INSERT INTO health_systems (id, name, status)
SELECT 'b1000000-0000-4000-8000-000000000001', 'Default Health System', 'active'
WHERE NOT EXISTS (SELECT 1 FROM health_systems WHERE id = 'b1000000-0000-4000-8000-000000000001');

UPDATE practices
SET health_system_id = 'b1000000-0000-4000-8000-000000000001'
WHERE health_system_id IS NULL;

ALTER TABLE practices ALTER COLUMN health_system_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS practice_memberships_one_active_user_idx
  ON practice_memberships (user_id)
  WHERE status = 'active';
`;

/** Health system logos + seed catalog names. */
export const MIGRATION_016_SQL = `
ALTER TABLE health_systems ADD COLUMN IF NOT EXISTS logo text;

INSERT INTO health_systems (id, name, status)
SELECT 'b1000000-0000-4000-8000-000000000011', 'Northwell Health', 'active'
WHERE NOT EXISTS (SELECT 1 FROM health_systems WHERE lower(name) = lower('Northwell Health'));

INSERT INTO health_systems (id, name, status)
SELECT 'b1000000-0000-4000-8000-000000000012', 'Catholic Health', 'active'
WHERE NOT EXISTS (SELECT 1 FROM health_systems WHERE lower(name) = lower('Catholic Health'));

INSERT INTO health_systems (id, name, status)
SELECT 'b1000000-0000-4000-8000-000000000013', 'Stony Brook', 'active'
WHERE NOT EXISTS (SELECT 1 FROM health_systems WHERE lower(name) = lower('Stony Brook'));

INSERT INTO health_systems (id, name, status)
SELECT 'b1000000-0000-4000-8000-000000000014', 'NYU', 'active'
WHERE NOT EXISTS (SELECT 1 FROM health_systems WHERE lower(name) = lower('NYU'));

INSERT INTO health_systems (id, name, status)
SELECT 'b1000000-0000-4000-8000-000000000015', 'Independent', 'active'
WHERE NOT EXISTS (SELECT 1 FROM health_systems WHERE lower(name) = lower('Independent'));
`;

/** Physician specialty / subspecialty catalog + user assignment columns. */
export const MIGRATION_017_SQL = `
CREATE TABLE IF NOT EXISTS specialties (
  id uuid PRIMARY KEY,
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS specialty_subspecialties (
  id uuid PRIMARY KEY,
  specialty_id uuid NOT NULL REFERENCES specialties(id),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (specialty_id, name)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES specialties(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subspecialty_id uuid REFERENCES specialty_subspecialties(id);
`;

/** Practice-owned favorite directory + personal stars. */
export const MIGRATION_018_SQL = `
ALTER TABLE favorite_consultants ADD COLUMN IF NOT EXISTS practice_id uuid REFERENCES practices(id);
ALTER TABLE favorite_consultants ADD COLUMN IF NOT EXISTS added_by_user_id uuid REFERENCES users(id);

UPDATE favorite_consultants AS fc
SET
  practice_id = pm.practice_id,
  added_by_user_id = COALESCE(fc.added_by_user_id, fc.owner_user_id)
FROM practice_memberships pm
WHERE pm.user_id = fc.owner_user_id
  AND pm.status = 'active'
  AND fc.practice_id IS NULL;

DELETE FROM favorite_consultants WHERE practice_id IS NULL;

DELETE FROM favorite_consultants a
USING favorite_consultants b
WHERE a.practice_id = b.practice_id
  AND a.consultant_user_id = b.consultant_user_id
  AND a.id::text > b.id::text;

CREATE TABLE IF NOT EXISTS favorite_consultant_stars (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  consultant_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, consultant_user_id)
);

INSERT INTO favorite_consultant_stars (id, user_id, consultant_user_id)
SELECT
  (
    substr(md5(fc.owner_user_id::text || fc.consultant_user_id::text), 1, 8) || '-' ||
    substr(md5(fc.owner_user_id::text || fc.consultant_user_id::text), 9, 4) || '-4' ||
    substr(md5(fc.owner_user_id::text || fc.consultant_user_id::text), 14, 3) || '-a' ||
    substr(md5(fc.owner_user_id::text || fc.consultant_user_id::text), 18, 3) || '-' ||
    substr(md5(fc.owner_user_id::text || fc.consultant_user_id::text), 21, 12)
  )::uuid,
  fc.owner_user_id,
  fc.consultant_user_id
FROM favorite_consultants fc
WHERE fc.owner_user_id IS NOT NULL
ON CONFLICT (user_id, consultant_user_id) DO NOTHING;

ALTER TABLE favorite_consultants DROP CONSTRAINT IF EXISTS favorite_consultants_owner_user_id_consultant_user_id_key;
DROP INDEX IF EXISTS favorite_consultants_owner_consultant_idx;

ALTER TABLE favorite_consultants DROP COLUMN IF EXISTS owner_user_id;
ALTER TABLE favorite_consultants ALTER COLUMN practice_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS favorite_consultants_practice_consultant_idx
  ON favorite_consultants (practice_id, consultant_user_id);
`;

/** One active practice membership per user; pending invites allowed while still elsewhere. */
export const MIGRATION_015_SQL = `
DROP INDEX IF EXISTS practice_memberships_one_current_user_idx;
CREATE UNIQUE INDEX IF NOT EXISTS practice_memberships_one_active_user_idx
  ON practice_memberships (user_id)
  WHERE status = 'active';
`;

/** Saved office phone on favorite consultants (cell stays on users.mobile_phone). */
export const MIGRATION_013_SQL = `
ALTER TABLE favorite_consultants ADD COLUMN IF NOT EXISTS office_phone text;
`;

/** Practice uniqueness by name + ZIP (name_zip_key). */
export const MIGRATION_012_SQL = `
ALTER TABLE practices ADD COLUMN IF NOT EXISTS name_zip_key text;
UPDATE practices
SET name_zip_key = lower(btrim(name)) || '|' || regexp_replace(coalesce(postal_code, ''), '[^0-9]', '', 'g')
WHERE name_zip_key IS NULL OR length(btrim(name_zip_key)) = 0;
CREATE UNIQUE INDEX IF NOT EXISTS practices_name_zip_key_unique
  ON practices (name_zip_key)
  WHERE status = 'active' AND name_zip_key IS NOT NULL AND length(btrim(name_zip_key)) > 1;
`;

/** Existing local PGlite DBs already applied 001; this reshapes practices. */
export const MIGRATION_002_SQL = `
ALTER TABLE practices DROP COLUMN IF EXISTS npi;
ALTER TABLE practices ADD COLUMN IF NOT EXISTS fax text NOT NULL DEFAULT '';
ALTER TABLE practices ADD COLUMN IF NOT EXISTS logo text;
`;

/** Allow several users without a mobile number (practice creators and invited staff). */
export const MIGRATION_003_SQL = `
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mobile_phone_key;
DROP INDEX IF EXISTS users_mobile_phone_key;
CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_phone_unique
  ON users (mobile_phone)
  WHERE mobile_phone IS NOT NULL AND length(btrim(mobile_phone)) > 0;
`;

/** Preserve the prior login time so the New badge can count consults received since then. */
export const MIGRATION_004_SQL = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_login_at timestamptz;
`;

/** Add request priority, comment, and the consultant office appointment date. */
export const MIGRATION_005_SQL = `
ALTER TABLE consults ADD COLUMN IF NOT EXISTS consult_priority text NOT NULL DEFAULT 'routine' CHECK (consult_priority IN ('immediate', 'urgent', 'routine'));
ALTER TABLE consults ADD COLUMN IF NOT EXISTS consult_request_comment text;
ALTER TABLE consults ADD COLUMN IF NOT EXISTS consult_appointment date;
`;
/** Remove the redundant NPI snapshot from consults. */
export const MIGRATION_006_SQL = `
ALTER TABLE consults DROP COLUMN IF EXISTS consulting_npi;
`;
/** Date on which the follow-up appointment is created. */
export const MIGRATION_007_SQL = `
ALTER TABLE consults ADD COLUMN IF NOT EXISTS fup_appointment_createdate date;
`;
/** Record the outcome, responsible user, response, and time a consult is addressed. */
export const MIGRATION_008_SQL = `
ALTER TABLE consults DROP COLUMN IF EXISTS fup_appointment_createdate;
ALTER TABLE consults ADD COLUMN resolution text CHECK (resolution IN ('scheduled', 'declined'));
ALTER TABLE consults ADD COLUMN addressed_by_user_id uuid REFERENCES users(id);
ALTER TABLE consults ADD COLUMN addressed_at timestamptz;
ALTER TABLE consults ADD COLUMN consult_response_comment text;
ALTER TABLE consults ADD CONSTRAINT consults_resolution_details_check CHECK (
    (resolution IS NULL AND addressed_by_user_id IS NULL AND addressed_at IS NULL)
    OR
    (resolution IS NOT NULL AND addressed_by_user_id IS NOT NULL AND addressed_at IS NOT NULL
      AND (
        (resolution = 'scheduled' AND consult_appointment IS NOT NULL)
        OR
        (resolution = 'declined' AND consult_response_comment IS NOT NULL
          AND length(btrim(consult_response_comment)) > 0)
      ))
  );

`;

/** SMS MFA option alongside authenticator TOTP. */
export const MIGRATION_009_SQL = `
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_method text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_sms_code_hash text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_sms_code_expires_at timestamptz;
UPDATE users SET mfa_method = 'totp' WHERE mfa_enabled_at IS NOT NULL AND mfa_method IS NULL AND mfa_secret_encrypted IS NOT NULL;
`;

/** Per-user favorite consultants. */
export const MIGRATION_010_SQL = `
CREATE TABLE IF NOT EXISTS favorite_consultants (
  id uuid PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  consultant_user_id uuid NOT NULL REFERENCES users(id),
  office_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, consultant_user_id)
);
`;

/** Password reset links (hashed tokens, short TTL). */
export const MIGRATION_011_SQL = `
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id, created_at DESC);
`;