import Link from "next/link";
import { redirect } from "next/navigation";
import { BarsChart, DonutChart, TrendChart } from "@/components/charts";
import { Stat } from "@/components/referral-table";
import { buildAnalytics, scopedReferrals } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { statusLabel } from "@/lib/format";
import { can } from "@/lib/rbac";

export default async function PcpAnalytics({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await requireUser("PCP");
  if (!can(user, "VIEW_ANALYTICS")) redirect("/pcp");

  const query = await searchParams;
  const canPractice = can(user, "VIEW_PRACTICE_ANALYTICS");
  const scope = query.scope === "practice" && canPractice ? "practice" : "self";
  const referrals =
    user.role === "OFFICE_MANAGER"
      ? scopedReferrals(user, "practice")
      : scopedReferrals(user, scope);
  const stats = buildAnalytics(referrals);
  const dest = stats.byDestination.map((row) => ({
    name: db.organizationById(row.id)?.name.replace(/ (Cardiology|Orthopedics|Gastroenterology|Dermatology|Neurology)/, "") ?? row.id,
    count: row.count,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Referral pattern
          </p>
          <h1 className="mt-2 text-4xl">
            {user.role === "OFFICE_MANAGER" ? "Practice outbound" : "Where your patients go"}
          </h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            Twelve-month volume, specialty mix, and conversion from send to specialist engagement.
          </p>
        </div>
        {canPractice && user.role !== "OFFICE_MANAGER" ? (
          <div className="flex rounded-full border border-line bg-white p-1 text-sm">
            <Link
              href="/pcp/analytics?scope=self"
              className={`rounded-full px-4 py-1.5 ${scope === "self" ? "bg-brand text-white" : "text-ink-soft"}`}
            >
              My panel
            </Link>
            <Link
              href="/pcp/analytics?scope=practice"
              className={`rounded-full px-4 py-1.5 ${scope === "practice" ? "bg-brand text-white" : "text-ink-soft"}`}
            >
              Practice
            </Link>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Referrals" value={stats.total} />
        <Stat label="Engaged" value={`${stats.conversionRate}%`} hint="Accepted, scheduled, or completed" />
        <Stat label="Avg hours to accept" value={stats.avgHoursToAccept || "—"} />
        <Stat label="Urgent share" value={stats.urgent} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-3xl border border-line bg-white p-5 lg:col-span-3">
          <h2 className="text-xl">Volume over time</h2>
          <TrendChart data={stats.monthly} />
        </section>
        <section className="rounded-3xl border border-line bg-white p-5 lg:col-span-2">
          <h2 className="text-xl">Status mix</h2>
          <DonutChart
            data={stats.byStatus.map((s) => ({ name: statusLabel(s.name as never), count: s.count }))}
          />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-white p-5">
          <h2 className="text-xl">By specialty</h2>
          <BarsChart data={stats.bySpecialty} />
        </section>
        <section className="rounded-3xl border border-line bg-white p-5">
          <h2 className="text-xl">By receiving practice</h2>
          <BarsChart data={dest} />
        </section>
      </div>
    </div>
  );
}
