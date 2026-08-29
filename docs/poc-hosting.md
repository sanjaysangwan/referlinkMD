# ReferLink proof-of-concept hosting

ReferLink’s next slice is **Twilio + Postgres + real auth**. This note is the cheap way to run that stack for a clinic demo **before** production (no real PHI, no HIPAA BAA).

Prices below are list prices as of August 2026. Confirm on the vendor pages before you buy.

## What we recommend

| Goal | Monthly | App | Database + auth | Alerts |
| --- | --- | --- | --- | --- |
| **Internal $0 demo** (you and a few colleagues) | **$0** | [Vercel Hobby](https://vercel.com/docs/plans/hobby) | [Supabase Free](https://supabase.com/pricing) | [Twilio trial](https://www.twilio.com/docs/usage/trials) |
| **Show it to practices and keep it up** | **~$5–15** | [Railway Hobby](https://railway.com/pricing) (app + Postgres) | Better Auth in that Postgres (no extra vendor) | Twilio trial, then pay-as-you-go |
| **Commercial-looking staging** | **~$45–60** | [Vercel Pro](https://vercel.com/pricing) ($20/user) | [Supabase Pro](https://supabase.com/pricing) ($25) | Twilio number + usage (~$5–15) |

**Pick Railway Hobby if you will walk a doctor through the product next week.** One bill, one Git deploy, Postgres stays on, commercial TOS is not a landmine.

**Pick Vercel Hobby + Supabase Free only if this stays a personal/internal prototype.** Vercel Hobby is [non-commercial](https://vercel.com/docs/limits/fair-use-guidelines). Supabase Free **pauses the database after 7 days idle**.

Do **not** put real patient data on any of these plans. HIPAA BAAs start at paid enterprise/team add-ons (for example Supabase Team + HIPAA), not on free tiers.

---

## Plan A — $0 internal POC

Best when: you need a public URL for the team, synthetic patients only, traffic is light.

### App — Vercel Hobby ($0)

- Native Next.js deploy from Git. Preview URLs on every push.
- Typical free envelope: ~100 GB transfer, ~1M function invocations, limited CPU-hours. Plenty for a handful of demo users.
- Function timeout is long enough for a Twilio send.
- **Limit:** personal / non-commercial use only. One person, not a clinic product.

Sign up: [vercel.com](https://vercel.com) → Import this repo → add env vars.

### Database + auth — Supabase Free ($0)

- Postgres 500 MB, 50,000 monthly active users, social + email auth.
- Two active projects. **Pauses after 1 week of no traffic** — click unpause before a demo.
- No automatic backups on Free. Fine for seed data; not fine for anything you cannot re-seed.
- Auth lives next to the data (good for a POC). ReferLink roles (MD / midlevel / office manager / staff) stay in our own tables.

Sign up: [supabase.com](https://supabase.com) → New project → copy the Postgres URI and auth keys.

### Alerts — Twilio trial ($0 for 30 days)

- **100 SMS**, **75 voice minutes**, no card required.
- You can only send to **verified numbers** (about 5). Your signup number is already verified.
- Trial SMS are prefixed. Voice/SMS limited to the signup country.
- Trial **expires in 30 days**. Upgrade before a live clinic walkthrough that must keep working.

After upgrade, US list rates are about **$0.0083 / SMS** and **$0.014 / min** outbound voice, plus about **$1.15 / month** for a local number. A POC that texts a few specialists a day is a few dollars, not hundreds.

---

## Plan B — ~$5–15/month “demo that stays up” (recommended)

Best when: you will share the URL with a PCP or specialist office.

### App + Postgres — Railway Hobby ($5)

- $5/month **includes $5 of usage**. A small Next.js service + a small Postgres often stays inside that credit.
- If you blow past $5 of CPU/RAM/disk, you pay the overage (roughly $20/vCPU-month and $10/GB-RAM-month). Cap spend in the dashboard.
- New accounts also get a **$5 trial for 30 days** with no card.
- There is a $0 “Free” plan with **$1/month** credit — enough to poke at a deploy, not enough to keep ReferLink + Postgres always on.

Auth: run **Better Auth** (or Auth.js) against the same Postgres. No Clerk bill, users stay in our database, ReferLink’s role matrix does not have to be rebuilt.

Twilio: same as Plan A. Budget **$5–15/month** once you leave trial (number + a few hundred texts/calls).

**Realistic Plan B total: $5 Railway + $0–15 Twilio ≈ $5–20/month.**

---

## Plan C — ~$45–60/month staging that looks like production

Best when: a practice is clicking every week and you want commercial TOS, backups, and a team.

| Piece | Plan | Why |
| --- | --- | --- |
| App | Vercel Pro (~$20/user) | Commercial use allowed, team seats, better logs |
| DB + auth | Supabase Pro (~$25, includes Micro compute credit) | No idle pause, 7-day backups, 8 GB disk |
| Alerts | Twilio pay-as-you-go | Real numbers, no trial prefix |

Neon Launch (usage-based, often ~$5+ if the database sleeps) is a cheaper Postgres-only alternative if you keep auth in-app (Better Auth) instead of Supabase Auth.

---

## Other options we looked at (and skipped for this POC)

| Option | Why not first |
| --- | --- |
| **Render Free** web | Spins down after 15 minutes; cold start is ugly in a live demo. Free Postgres **expires in 30 days**. Paid web + paid Postgres is ~$14/month — more than Railway Hobby for the same job. |
| **Fly.io** | No free tier for new accounts. Cheap at small size, more ops (Machines, volumes, IPv4). Better later if we need always-on near the clinic. |
| **Clerk** | Fast UI, generous MAU free tier, but ReferLink already has clinic-specific roles. Extra vendor and a steep paid curve if MAU grows. Use only if we want hosted login UI tomorrow and will migrate later. |
| **Neon Free alone** | Excellent serverless Postgres (0.5 GB, scale-to-zero, branching). Pair it with Vercel if we do **not** want Supabase Auth. Cold starts after idle. |
| **Netlify** | Fine for static sites; Next.js App Router + server actions is a Vercel/Railway/Render problem. |

---

## Suggested env for the next slice

```
# App
AUTH_SECRET=
DATABASE_URL=postgresql://...

# Real auth (Supabase path)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Or Better Auth on our Postgres — no extra keys beyond DATABASE_URL + AUTH_SECRET

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

---

## Open accounts in this order

1. **Twilio** trial — verify the two or three phones you will use in demos.
2. **Supabase** (Plan A) or **Railway** (Plan B) — create Postgres, save `DATABASE_URL`.
3. **Vercel** (Plan A/C) or deploy the same Git repo on Railway (Plan B).
4. Set env vars, seed synthetic users only, walk the PCP → alert → specialist loop.

When a clinic wants this on real patients, stop and move to a host that will sign a **BAA** (typically AWS/GCP + a HIPAA-ready Postgres, or Supabase Team with the HIPAA add-on). That is a different budget and a different architecture review — not these POC plans.
