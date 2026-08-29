import Link from "next/link";
import { ReferralTable, Stat } from "@/components/referral-table";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, roleLabel } from "@/lib/rbac";
import { clinicianName } from "@/lib/format";

export default async function SpecialistHome() {
  const user = await requireUser("SPECIALIST");
  const pool = db
    .referralsToOrg(user.organizationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const queue = pool.filter((r) => ["ALERTED", "SUBMITTED"].includes(r.status));
  const mine = pool.filter((r) => r.assignedSpecialistUserId === user.id);
  const alertsToday = db.alertsForOrg(user.organizationId).slice(0, 40);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {user.organizationName}
          </p>
          <h1 className="mt-2 text-4xl">Inbound queue</h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            Signed in as {clinicianName(user.name, user.credentials)} · {roleLabel(user.role)}.
            New work arrives with a text or phone alert to whoever opted in.
          </p>
        </div>
        {can(user, "MANAGE_ALERTS") ? (
          <Link
            href="/specialist/alerts"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold"
          >
            Alert settings
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Waiting in queue" value={queue.length} hint="Not yet accepted" />
        <Stat label="Assigned to you" value={mine.length} hint={user.role === "STAFF" ? "Staff see the practice queue" : "Accepted onto your panel"} />
        <Stat label="Alerts on file" value={alertsToday.length} hint="SMS and voice deliveries" />
      </div>

      {!can(user, "ACCEPT_REFERRAL") && !can(user, "SCHEDULE_REFERRAL") ? null : (
        <p className="text-sm text-ink-soft">
          {can(user, "ACCEPT_REFERRAL")
            ? "You can accept or decline clinical referrals."
            : "Staff and office managers schedule; clinicians accept."}{" "}
          {can(user, "VIEW_CLINICAL") ? "Clinical summaries are visible." : "Clinical summaries are hidden for this role."}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-2xl">Needs a first look</h2>
        <ReferralTable referrals={queue} hrefBase="/specialist/referrals" showSource />
      </section>
    </div>
  );
}
