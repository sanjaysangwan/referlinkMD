import type { BillingSnapshot, Organization } from "./types";

export const SPECIALIST_MONTHLY_USD = 49;
export const SPECIALIST_TRIAL_MONTHS = 3;

/**
 * Specialists are free until we have adoption.
 *
 * Flip on without a rewrite:
 *   SPECIALIST_BILLING_ENABLED=true
 *
 * When off: paywall, trial banner, billing nav, and pricing copy stay hidden.
 * Org trial clocks are still written on specialist signup, so turning this on
 * later enforces the existing 3-month trial → $49/month model.
 */
export function specialistBillingEnabled(): boolean {
  const raw = (
    process.env.SPECIALIST_BILLING_ENABLED ??
    process.env.NEXT_PUBLIC_SPECIALIST_BILLING_ENABLED ??
    ""
  )
    .trim()
    .toLowerCase();
  return raw === "true" || raw === "1" || raw === "on";
}

export function addMonths(from: Date, months: number) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function trialEndFrom(start = new Date()) {
  return addMonths(start, SPECIALIST_TRIAL_MONTHS).toISOString();
}

export function billingFor(org: Organization): BillingSnapshot {
  if (org.type === "PCP" || org.subscriptionStatus === "free") {
    return { status: "free", monthlyPrice: 0 };
  }
  if (org.subscriptionStatus === "active") {
    return {
      status: "active",
      monthlyPrice: SPECIALIST_MONTHLY_USD,
      trialEndsAt: org.trialEndsAt,
      subscribedAt: org.subscribedAt,
    };
  }
  const trialEndsAt = org.trialEndsAt ?? trialEndFrom();
  const msLeft = new Date(trialEndsAt).getTime() - Date.now();
  const daysLeftInTrial = Math.max(0, Math.ceil(msLeft / 86_400_000));
  if (msLeft > 0) {
    return {
      status: "trial",
      monthlyPrice: SPECIALIST_MONTHLY_USD,
      trialEndsAt,
      daysLeftInTrial,
    };
  }
  return {
    status: "past_due",
    monthlyPrice: SPECIALIST_MONTHLY_USD,
    trialEndsAt,
    daysLeftInTrial: 0,
  };
}

export function specialistHasAccess(billing: BillingSnapshot) {
  if (!specialistBillingEnabled()) return true;
  return billing.status === "trial" || billing.status === "active";
}

export function formatTrialEnd(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function specialistSignupCta() {
  return specialistBillingEnabled()
    ? "Start a 3-month specialist trial"
    : "Create a specialist practice";
}

export function specialistSignupSubmit() {
  return specialistBillingEnabled() ? "Start 3-month free trial" : "Create specialist practice";
}

export function specialistSignupNav() {
  return specialistBillingEnabled() ? "Start 3-month trial" : "Specialist signup";
}

export function specialistHeaderCta() {
  return specialistBillingEnabled() ? "Specialist trial" : "Specialist signup";
}
