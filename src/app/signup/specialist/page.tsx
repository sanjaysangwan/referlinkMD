import Link from "next/link";
import { Brand } from "@/components/brand";
import {
  SPECIALIST_MONTHLY_USD,
  SPECIALIST_TRIAL_MONTHS,
  specialistBillingEnabled,
} from "@/lib/billing";
import { SignupForm } from "../signup-form";

export default function SpecialistSignup() {
  const billingOn = specialistBillingEnabled();

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <section className="hidden flex-col justify-between bg-brand-deep p-12 text-sand lg:flex">
        <Brand light subtitle="Specialty care" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            {billingOn
              ? `${SPECIALIST_TRIAL_MONTHS} months free, then $${SPECIALIST_MONTHLY_USD}/month`
              : "Free while we grow the network"}
          </p>
          <h1 className="mt-3 max-w-md text-5xl leading-[1.05] text-white">
            {billingOn
              ? "Take every inbound referral for a full season before you pay."
              : "Take every inbound referral without a subscription."}
          </h1>
          <p className="mt-5 max-w-md text-white/75">
            {billingOn
              ? `Alerts, queue, and pool analytics are included in the trial. After ${SPECIALIST_TRIAL_MONTHS} months the practice is $${SPECIALIST_MONTHLY_USD}/month. Primary care never pays.`
              : "Alerts, queue, and pool analytics are included. Primary care never pays, and specialists stay free until the network has critical mass."}
          </p>
        </div>
        <p className="text-sm text-white/50">
          {billingOn
            ? "Card collection comes later. This prototype starts the trial clock on signup."
            : "Synthetic demo data only if you use the roster. New signups start empty."}
        </p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand subtitle="Specialty care" />
          </div>
          <h2 className="text-3xl">{billingOn ? "Start a specialist trial" : "Create a specialist practice"}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Already on ReferMDLink?{" "}
            <Link className="font-semibold text-brand" href="/login/specialist">
              Sign in
            </Link>
          </p>
          <div className="mt-8">
            <SignupForm portal="specialist" billingEnabled={billingOn} />
          </div>
        </div>
      </section>
    </div>
  );
}
