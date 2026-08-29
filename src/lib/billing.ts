import type { BillingSnapshot, Organization } from "./types";

export const SPECIALIST_MONTHLY_USD = 49;
export const SPECIALIST_TRIAL_MONTHS = 3;

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
  return billing.status === "trial" || billing.status === "active";
}

export function formatTrialEnd(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
