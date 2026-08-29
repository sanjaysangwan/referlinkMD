import { ReferralTable } from "@/components/referral-table";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function SpecialistReferrals() {
  const user = await requireUser("SPECIALIST");
  const referrals = db
    .referralsToOrg(user.organizationId)
    .filter((r) =>
      user.role === "MIDLEVEL" ? r.assignedSpecialistUserId === user.id || ["ALERTED", "SUBMITTED"].includes(r.status) : true,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Pool</p>
        <h1 className="mt-2 text-4xl">Referrals into this practice</h1>
        <p className="mt-2 text-ink-soft">
          Midlevels see unassigned work plus their own panel. Physicians and operations see the full pool.
        </p>
      </div>
      <ReferralTable referrals={referrals} hrefBase="/specialist/referrals" showSource />
    </div>
  );
}
