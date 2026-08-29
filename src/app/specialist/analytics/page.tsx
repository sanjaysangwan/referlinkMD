import Link from "next/link";
import { redirect } from "next/navigation";
import { BarsChart, DonutChart, TrendChart } from "@/components/charts";
import { Stat } from "@/components/referral-table";
import { buildAnalytics, scopedReferrals } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { statusLabel } from "@/lib/format";
import { can } from "@/lib/rbac";

export default async function SpecialistAnalytics({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await requireUser("SPECIALIST");
  if (!can(user, "VIEW_ANALYTICS")) redirect("/specialist");

  const query = await searchParams;
  const canPractice = can(user, "VIEW_PRACTICE_ANALYTICS");
  const scope: "self" | "practice" =
    user.role === "OFFICE_MANAGER" || (canPractice && query.scope !== "self")
      ? "practice"
      : "self";
  const referrals = scopedReferrals(user, scope);
  const stats = buildAnalytics(referrals);
  const sources = stats.bySource.map((row) => ({
    name: db.organizationById(row.id)?.name.replace(" Family Medicine", "").replace(" Internal Medicine", "") ?? row.id,
    count: row.count,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Referral pool
          </p>
          <h1 className="mt-2 text-4xl">Who is sending you patients</h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            Volume, referring practices, urgency, and how quickly this specialty shop engages.
          </p>
        </div>
        {canPractice && user.role !== "OFFICE_MANAGER" ? (
          <div className="flex rounded-full border border-line bg-white p-1 text-sm">
            <Link
              href="/specialist/analytics?scope=self"
              className={`rounded-full px-4 py-1.5 ${scope === "self" ? "bg-brand text-white" : "text-ink-soft"}`}
            >
              Assigned to me
            </Link>
            <Link
              href="/specialist/analytics?scope=practice"
              className={`rounded-full px-4 py-1.5 ${scope === "practice" ? "bg-brand text-white" : "text-ink-soft"}`}
            >
              Full pool
            </Link>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="In this view" value={stats.total} />
        <Stat label="Engagement" value={`${stats.conversionRate}%`} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Urgent" value={stats.urgent} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-3xl border border-line bg-white p-5 lg:col-span-3">
          <h2 className="text-xl">Inbound over time</h2>
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
          <h2 className="text-xl">By referring practice</h2>
          <BarsChart data={sources} />
        </section>
        <section className="rounded-3xl border border-line bg-white p-5">
          <h2 className="text-xl">Urgency</h2>
          <BarsChart
            data={stats.byUrgency.map((u) => ({ name: u.name, count: u.count }))}
          />
        </section>
      </div>
    </div>
  );
}
