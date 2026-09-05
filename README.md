# ReferLinkMD

Peer-to-peer consults for physician practices. **Primary team** requests a consult; **consulting team** receives a PHI-free SMS and views patient name, DOB, and phone after login. There is no note writing. Clinician name, NPI, and mobile are treated as public professional information.

This is a HIPAA-ready **proof of concept** with synthetic patients only. It is not a HIPAA certification.

## Demo

```bash
npm install
npm run dev
```

Open http://localhost:3000

Password for seeded accounts: `demo1234`  
Authenticator secret (all demo accounts): `JBSWY3DPEHPK3PXP`

| Practice | Role | Email |
| --- | --- | --- |
| Harbor Family Medicine | Physician | elena@referlink.demo |
| Harbor Family Medicine | APP | jordan@referlink.demo |
| Harbor Family Medicine | Office manager | priya@referlink.demo |
| Riverside Internal Medicine | Physician | david@referlink.demo |
| Riverside Internal Medicine | APP | amina@referlink.demo |

David already has a seeded inbound consult from Harbor. Request a consult to `(555) 010-0999` to try the new-consultant signup link (see **Demo inbox**).

## Data

Postgres schema: [db/schema.sql](db/schema.sql). Local runtime is PGlite (Postgres in-process) under `data/referlink`. Optional `docker-compose.yml` runs Postgres 16 for a later RDS-shaped deploy.

SMS and invite email are written to the in-app **Demo inbox**. Message bodies never include patient name, DOB, or phone.

## Security in this POC

- Argon2id password hashes
- TOTP MFA
- 15-minute idle session
- Access tokens stored as SHA-256 hashes
- Audit log without extra PHI in metadata
- `is_synthetic=true` required in demo
