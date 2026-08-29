import { ReferralTable } from "@/components/referral-table";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function PcpReferrals() {
  const user = await requireUser("PCP");
  const referrals = db
    .referralsFromOrg(user.organizationId)
    .filter((r) =>
      user.privileges.includes("VIEW_PRACTICE_ANALYTICS") || user.role === "STAFF" || user.role === "OFFICE_MANAGER"
        ? true
        : r.referringUserId === user.id,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-harbor">Outbound</p>
        <h1 className="mt-2 text-4xl">Referrals from this practice</h1>
        <p className="mt-2 text-ink-soft">
          {user.role === "MD" || user.role === "MIDLEVEL"
            ? "Clinicians see their own panel by default. Practice-wide analytics live next door."
            : "Operations can see the full outbound book."}
        </p>
      </div>
      <ReferralTable referrals={referrals} hrefBase="/pcp/referrals" showDestination />
    </div>
  );
}
