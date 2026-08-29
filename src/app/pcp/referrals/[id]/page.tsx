import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill, UrgencyPill } from "@/components/pills";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { channelLabel, formatPhone } from "@/lib/notifications";
import { can } from "@/lib/rbac";

export default async function PcpReferralDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const user = await requireUser("PCP");
  const { id } = await params;
  const query = await searchParams;
  const referral = db.referralById(id);
  if (!referral || referral.referringOrganizationId !== user.organizationId) notFound();

  const patient = db.patientById(referral.patientId);
  const dest = db.organizationById(referral.specialistOrganizationId);
  const referrer = db.userById(referral.referringUserId);
  const alerts = db.alertsForReferral(referral.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/pcp/referrals" className="text-sm text-harbor">
        ← Outbound
      </Link>
      {query.sent ? (
        <div className="rounded-3xl border border-harbor/20 bg-mist p-5">
          <h2 className="text-xl">Specialist practice notified</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {dest?.name} received {alerts.length} alert{alerts.length === 1 ? "" : "s"} (text and/or phone)
            based on each recipient’s preferences.
          </p>
        </div>
      ) : null}

      <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-harbor">
              {referral.displayId}
            </p>
            <h1 className="mt-2 text-4xl">{patient?.name}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {patient?.mrn} · {patient?.insurance}
            </p>
          </div>
          <div className="flex gap-2">
            <UrgencyPill urgency={referral.urgency} />
            <StatusPill status={referral.status} />
          </div>
        </div>

        <dl className="mt-8 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-ink-soft">To</dt>
            <dd className="font-medium">
              {dest?.name} · {referral.specialty}
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">From</dt>
            <dd className="font-medium">
              {referrer?.name}, {referrer?.credentials}
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">Opened</dt>
            <dd className="font-medium">{formatDateTime(referral.createdAt)}</dd>
          </div>
        </dl>

        <h2 className="mt-8 text-xl">Reason</h2>
        <p className="mt-2 text-ink-soft">{referral.reason}</p>

        {can(user, "VIEW_CLINICAL") ? (
          <>
            <h2 className="mt-8 text-xl">Clinical summary</h2>
            <p className="mt-2 text-ink-soft">
              {referral.clinicalSummary || "No clinical note attached."}
            </p>
          </>
        ) : (
          <p className="mt-8 rounded-2xl bg-sand px-4 py-3 text-sm text-ink-soft">
            Clinical summaries are limited to physician and midlevel logins.
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-xl">Alert trail</h2>
        {alerts.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No alerts recorded for this referral yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {alerts.map((a) => {
              const recipient = db.userById(a.recipientUserId);
              return (
                <li key={a.id} className="rounded-2xl bg-sand/60 px-4 py-3 text-sm">
                  <div className="font-medium">
                    {channelLabel(a.channel)} to {recipient?.name} · {formatPhone(a.to)}
                  </div>
                  <div className="text-ink-soft">
                    {a.status} via {a.provider} · {formatDateTime(a.createdAt)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
