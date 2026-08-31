import Link from "next/link";
import { Brand } from "@/components/brand";
import { SPECIALIST_MONTHLY_USD, SPECIALIST_TRIAL_MONTHS, specialistBillingEnabled } from "@/lib/billing";

export default function LoginIndex() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-[32px] border border-line bg-white p-8 shadow-[var(--shadow)] md:p-12">
        <Brand subtitle="Choose a portal" />
        <h1 className="mt-8 text-4xl">Who is signing in?</h1>
        <p className="mt-3 max-w-lg text-ink-soft">
          ReferMDLink keeps primary care and specialty workspaces separate so privileges stay honest.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Link
            href="/login/pcp"
            className="rounded-3xl border border-line bg-sand/50 p-6 hover:border-brand"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Primary care
            </div>
            <h2 className="mt-2 text-2xl">PCP practice</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Free to sign up. Refer patients, track outbound work, and read your referral pattern.
            </p>
          </Link>
          <Link
            href="/login/specialist"
            className="rounded-3xl border border-line bg-mist/50 p-6 hover:border-brand"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Specialty care
            </div>
            <h2 className="mt-2 text-2xl">Specialist practice</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {specialistBillingEnabled()
                ? `${SPECIALIST_TRIAL_MONTHS} months free, then $${SPECIALIST_MONTHLY_USD}/month. Receive alerts and work the inbound pool.`
                : "Free to join. Receive alerts and work the inbound pool."}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
