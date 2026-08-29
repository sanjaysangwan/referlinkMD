import { startSpecialistSubscriptionAction } from "@/app/actions/billing";
import { SubmitButton } from "@/components/submit-button";
import {
  formatTrialEnd,
  SPECIALIST_MONTHLY_USD,
  SPECIALIST_TRIAL_MONTHS,
} from "@/lib/billing";
import { can } from "@/lib/rbac";
import type { SessionUser } from "@/lib/types";

export function BillingPanel({
  user,
  paid,
  privilegeError,
}: {
  user: SessionUser;
  paid?: boolean;
  privilegeError?: boolean;
}) {
  const billing = user.billing;
  const canPay = can(user, "MANAGE_BILLING");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Billing</p>
        <h1 className="mt-2 text-4xl">Specialist subscription</h1>
        <p className="mt-2 text-ink-soft">
          Primary care is free. Specialty practices get {SPECIALIST_TRIAL_MONTHS} months, then $
          {SPECIALIST_MONTHLY_USD}/month for the whole practice — not per clinician.
        </p>
      </div>

      {paid ? (
        <div className="rounded-3xl border border-ok/20 bg-[#e7f3ea] p-5 text-ok">
          {user.organizationName} is on the paid plan. Inbound referrals stay open.
        </div>
      ) : null}
      {privilegeError ? (
        <p className="rounded-2xl bg-[#f8e8e4] px-4 py-3 text-sm text-coral">
          Only a physician or office manager can start the paid plan.
        </p>
      ) : null}

      <div className="rounded-3xl border border-line bg-white p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Current status
        </div>
        <p className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl">
          {billing.status === "trial" && "Free trial"}
          {billing.status === "active" && "Paid — $49/month"}
          {billing.status === "past_due" && "Trial ended"}
          {billing.status === "free" && "Free"}
        </p>
        {billing.status === "trial" && billing.trialEndsAt ? (
          <p className="mt-2 text-sm text-ink-soft">
            {billing.daysLeftInTrial} day{billing.daysLeftInTrial === 1 ? "" : "s"} left · ends{" "}
            {formatTrialEnd(billing.trialEndsAt)}. No charge until then.
          </p>
        ) : null}
        {billing.status === "past_due" ? (
          <p className="mt-2 text-sm text-ink-soft">
            The inbound queue is paused until this practice starts ${SPECIALIST_MONTHLY_USD}/month.
            Referring PCPs no longer see you as an open destination.
          </p>
        ) : null}
        {billing.status === "active" && billing.subscribedAt ? (
          <p className="mt-2 text-sm text-ink-soft">
            Subscribed {formatTrialEnd(billing.subscribedAt)}. Stripe checkout will replace this
            button in production.
          </p>
        ) : null}

        {billing.status !== "active" && canPay ? (
          <form action={startSpecialistSubscriptionAction} className="mt-6">
            <SubmitButton className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white">
              Start ${SPECIALIST_MONTHLY_USD}/month
            </SubmitButton>
          </form>
        ) : null}
        {billing.status !== "active" && !canPay ? (
          <p className="mt-6 rounded-2xl bg-sand px-4 py-3 text-sm text-ink-soft">
            Ask a physician or office manager to start the paid plan.
          </p>
        ) : null}
      </div>
    </div>
  );
}
