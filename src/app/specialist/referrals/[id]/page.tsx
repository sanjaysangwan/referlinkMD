import Link from "next/link";
import { notFound } from "next/navigation";
import { updateReferralStatusAction } from "@/app/actions/referrals";
import { StatusPill, UrgencyPill } from "@/components/pills";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { channelLabel, formatPhone } from "@/lib/notifications";
import { can } from "@/lib/rbac";

export default async function SpecialistReferralDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser("SPECIALIST");
  const { id } = await params;
  const query = await searchParams;
  const referral = db.referralById(id);
  if (!referral || referral.specialistOrganizationId !== user.organizationId) notFound();

  const patient = db.patientById(referral.patientId);
  const source = db.organizationById(referral.referringOrganizationId);
  const referrer = db.userById(referral.referringUserId);
  const alerts = db.alertsForReferral(referral.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/specialist" className="text-sm text-brand">
        ← Queue
      </Link>
      {query.error === "privilege" ? (
        <p className="rounded-2xl bg-[#f8e8e4] px-4 py-3 text-sm text-coral">
          That action is not in this role’s privilege set.
        </p>
      ) : null}

      <div className="rounded-3xl border border-line bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              {referral.displayId} · {referral.specialty}
            </p>
            <h1 className="mt-2 text-4xl">{patient?.name}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              From {source?.name} · {referrer?.name}, {referrer?.credentials}
            </p>
          </div>
          <div className="flex gap-2">
            <UrgencyPill urgency={referral.urgency} />
            <StatusPill status={referral.status} />
          </div>
        </div>

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
            Clinical detail is limited to physician and midlevel logins. Schedule from the reason and demographics.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-2">
          {can(user, "ACCEPT_REFERRAL") && referral.status !== "DECLINED" && referral.status !== "COMPLETED" ? (
            <>
              <form action={updateReferralStatusAction}>
                <input type="hidden" name="referralId" value={referral.id} />
                <input type="hidden" name="status" value="ACCEPTED" />
                <SubmitButton className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
                  Accept to my panel
                </SubmitButton>
              </form>
              <form action={updateReferralStatusAction}>
                <input type="hidden" name="referralId" value={referral.id} />
                <input type="hidden" name="status" value="DECLINED" />
                <SubmitButton className="rounded-full border border-coral px-5 py-2.5 text-sm font-semibold text-coral">
                  Decline
                </SubmitButton>
              </form>
            </>
          ) : null}
          {can(user, "SCHEDULE_REFERRAL") && referral.status !== "DECLINED" ? (
            <form action={updateReferralStatusAction}>
              <input type="hidden" name="referralId" value={referral.id} />
              <input type="hidden" name="status" value="SCHEDULED" />
              <SubmitButton className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold">
                Mark scheduled
              </SubmitButton>
            </form>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-xl">How this practice was pinged</h2>
        <ul className="mt-4 space-y-3">
          {alerts.map((a) => {
            const recipient = db.userById(a.recipientUserId);
            return (
              <li key={a.id} className="rounded-2xl bg-sand/60 px-4 py-3 text-sm">
                <div className="font-medium">
                  {channelLabel(a.channel)} → {recipient?.name} · {formatPhone(a.to)}
                </div>
                <div className="text-ink-soft">
                  {a.status} · {formatDateTime(a.createdAt)}
                </div>
                <div className="mt-1 text-ink-soft">{a.message}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
