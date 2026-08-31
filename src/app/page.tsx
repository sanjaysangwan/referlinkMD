import Link from "next/link";
import { Brand } from "@/components/brand";
import {
  SPECIALIST_MONTHLY_USD,
  SPECIALIST_TRIAL_MONTHS,
  specialistBillingEnabled,
  specialistHeaderCta,
  specialistSignupCta,
} from "@/lib/billing";

export default function HomePage() {
  const billingOn = specialistBillingEnabled();

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand subtitle="Clinical referrals" />
        <div className="flex gap-3 text-sm">
          <Link className="rounded-full px-4 py-2 text-ink-soft hover:text-ink" href="/signup/pcp">
            Free PCP signup
          </Link>
          <Link className="rounded-full px-4 py-2 text-ink-soft hover:text-ink" href="/login/pcp">
            Sign in
          </Link>
          <Link
            className="rounded-full bg-ink px-4 py-2 text-sand hover:bg-brand-deep"
            href="/signup/specialist"
          >
            {specialistHeaderCta()}
          </Link>
        </div>
      </header>

      <section className="brand-grid mx-auto max-w-6xl px-6 pb-10 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          Phase one prototype
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-ink md:text-6xl">
          The handoff between primary care and specialty should not go quiet.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          ReferMDLink is a referral workspace for clinics. A PCP sends a patient.
          The specialist practice is alerted by text or phone. Each side can
          see its own patterns over time — with privileges that match MD,
          midlevel, office manager, and staff.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup/pcp"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-deep"
          >
            Create a free PCP practice
          </Link>
          <Link
            href="/signup/specialist"
            className="rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink hover:border-ink/40"
          >
            {specialistSignupCta()}
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-8 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Primary care</p>
          <h2 className="mt-3 text-3xl">Free to sign up</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            The practice that starts the referral never pays. Create the workspace, invite MD,
            midlevel, office manager, and staff, and send patients.
          </p>
          <Link href="/signup/pcp" className="mt-6 inline-block text-sm font-semibold text-brand">
            Open a free PCP account
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Specialty care</p>
          {billingOn ? (
            <>
              <h2 className="mt-3 text-3xl">
                {SPECIALIST_TRIAL_MONTHS} months free, then ${SPECIALIST_MONTHLY_USD}/month
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                One price for the whole specialist practice after the trial — not per clinician.
                Alerts, queue, and pool analytics stay on during the trial. When it ends, inbound
                work pauses until the practice subscribes.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-3xl">Free while we grow</h2>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Specialty practices get the full inbound queue, alerts, and pool analytics at no
                charge. We want specialists on the network first.
              </p>
            </>
          )}
          <Link href="/signup/specialist" className="mt-6 inline-block text-sm font-semibold text-brand">
            {specialistSignupCta()}
          </Link>
        </article>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          {
            title: "Role-true logins",
            body: "Separate PCP and specialist portals. Physician, midlevel, office manager, and staff each see a different slice of the work.",
          },
          {
            title: "Alerts that land",
            body: "When a referral is sent, ReferMDLink fans out SMS and voice alerts to the specialist team according to each person’s preferences.",
          },
          {
            title: "Patterns, not just a queue",
            body: "PCPs chart where their patients go. Specialists chart who is sending them work — volume, urgency, and conversion over twelve months.",
          },
        ].map((card) => (
          <article key={card.title} className="rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow)]">
            <h2 className="text-2xl">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink-soft">{card.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
