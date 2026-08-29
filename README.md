# Harbor

Phase-one prototype of a **primary care → specialist referral** product.

A PCP practice sends a patient. The specialist practice is notified by **text and/or phone**. Each side can chart referral patterns over time. Logins are split by portal (PCP vs specialist) and by role (**physician, midlevel, office manager, staff**), with privileges enforced on the server, not only in the nav.

This build uses **synthetic clinic data only**. Do not enter real PHI.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo sign-in

Password for every roster account: `HarborDemo1!`

### Primary care — Riverside Family Medicine

| Role | Name | Email |
| --- | --- | --- |
| Physician | Elena Vasquez, MD | `elena.vasquez@riverside.health` |
| Midlevel | Jordan Hale, PA-C | `jordan.hale@riverside.health` |
| Office manager | Priya Shah | `priya.shah@riverside.health` |
| Staff | Marcus Chen | `marcus.chen@riverside.health` |

Portal: `/login/pcp`

### Specialty care — Summit Cardiology

| Role | Name | Email |
| --- | --- | --- |
| Physician | Nathan Cole, MD | `nathan.cole@summitcardio.health` |
| Midlevel | Avery Kim, NP | `avery.kim@summitcardio.health` |
| Office manager | Sam Ortiz | `sam.ortiz@summitcardio.health` |
| Staff | Riley Brooks | `riley.brooks@summitcardio.health` |

Portal: `/login/specialist`

## What each role can do

**PCP**

- Physician: create referrals with clinical notes, own + practice analytics, personal alert settings
- Midlevel: create referrals with clinical notes, own analytics, personal alert settings
- Office manager: practice analytics, team directory, alert settings — no clinical create or notes
- Staff: send administrative referrals — no analytics, no clinical summary

**Specialist**

- Physician: accept/decline, full pool analytics, alerts, alert log
- Midlevel: accept/decline, assigned-panel analytics, alerts
- Office manager: schedule, pool analytics, team, alerts, alert log
- Staff: schedule only — no clinical notes, no analytics

## Alerts

Sending a referral fans out SMS and voice alerts to specialist users who opted in (urgent referrals trigger voice when enabled). The notifier is a Twilio-shaped adapter. Without Twilio env vars it **records a delivered mock** so the flow is still visible in the referral’s alert trail.

```
AUTH_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

## Stack

Next.js App Router, TypeScript, Tailwind, signed httpOnly sessions, in-memory store (swap point for Postgres), Recharts. Built so the domain (orgs, roles, referrals, notifications) can move onto a real database and identity provider without rewriting the product surface.
