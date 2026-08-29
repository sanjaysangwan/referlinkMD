import Link from "next/link";
import { ReferralTable, Stat } from "@/components/referral-table";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, roleLabel } from "@/lib/rbac";
import { clinicianName } from "@/lib/format";

export default async function PcpHome() {
  const user = await requireUser("PCP");
  const mine = db
    .referralsFromOrg(user.organizationId)
    .filter((r) => (user.role === "MD" || user.role === "MIDLEVEL" ? r.referringUserId === user.id : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recent = mine.slice(0, 8);
  const open = mine.filter((r) => ["ALERTED", "SUBMITTED", "ACCEPTED"].includes(r.status)).length;
  const urgent = mine.filter((r) => r.urgency === "URGENT" && r.status !== "COMPLETED").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {user.organizationName}
          </p>
          <h1 className="mt-2 text-4xl">Good day, {clinicianName(user.name, user.credentials)}.</h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            You are signed in as {roleLabel(user.role).toLowerCase()}. ReferLink shows only the
            tools that role is allowed to use.
          </p>
        </div>
        {can(user, "CREATE_REFERRAL") ? (
          <Link
            href="/pcp/referrals/new"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep"
          >
            New referral
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Outbound in your view" value={mine.length} hint="Seeded plus live sends this session" />
        <Stat label="Still open" value={open} hint="Notified, accepted, or waiting" />
        <Stat label="Urgent" value={urgent} hint="Needs specialist attention" />
      </div>

      {!can(user, "CREATE_REFERRAL") ? (
        <div className="rounded-3xl border border-line bg-mist/50 p-5 text-sm text-ink-soft">
          Office managers do not place clinical referrals. Use analytics and team settings
          to run the practice pattern.
        </div>
      ) : null}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-2xl">Recent outbound</h2>
          <Link className="text-sm font-semibold text-brand" href="/pcp/referrals">
            All referrals
          </Link>
        </div>
        <ReferralTable referrals={recent} hrefBase="/pcp/referrals" showDestination />
      </section>
    </div>
  );
}
