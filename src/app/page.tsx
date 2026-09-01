import Link from "next/link";
import { Brand } from "@/components/brand";
import { APP_NAME } from "@/lib/constants";
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
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <Brand subtitle="Clinical referrals" />
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="rounded-full px-4 py-2 text-ink-soft hover:text-ink" href="/login">
            Sign in
          </Link>
          <Link className="rounded-full px-4 py-2 text-ink-soft hover:text-ink" href="/signup/pcp">
            PCP signup
          </Link>
          <Link
            className="rounded-full bg-ink px-4 py-2 text-sand hover:bg-brand-deep"
            href="/signup/specialist"
          >
            {specialistHeaderCta()}
          </Link>
        </nav>
      </header>

      <section className="brand-grid mx-auto max-w-6xl px-6 pb-12 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          Primary care to specialty
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-ink md:text-6xl">
          Referrals that arrive — with a record of what happened next.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          {APP_NAME} is the workspace between a PCP practice and a specialist practice. Send a
          patient. The specialist team is alerted by text or phone. Both sides see their own
          patterns — with privileges that match physician, midlevel, office manager, and staff.
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
          <Link
            href="/login"
            className="rounded-full px-6 py-3 text-sm font-semibold text-brand hover:text-brand-deep"
          >
            Sign in to a portal
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">How it works</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "PCP sends the patient",
              body: "Primary care creates the referral with reason, urgency, and — when the role allows — a clinical summary.",
            },
            {
              step: "02",
              title: "The specialist is alerted",
              body: "Text and optional phone alerts fan out to the specialty team the moment the referral is sent.",
            },
            {
              step: "03",
              title: "Both sides see the pattern",
              body: "PCPs chart where patients go. Specialists work the inbound pool and see who is sending them work.",
            },
          ].map((item) => (
            <article
              key={item.step}
              className="rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow)]"
            >
              <p className="text-xs font-semibold tracking-[0.16em] text-brand">{item.step}</p>
              <h2 className="mt-3 text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-soft">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Primary care</p>
          <h2 className="mt-3 text-3xl">Free for the practice that starts the referral</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Create the workspace, invite physician, midlevel, office manager, and staff, and send
            patients. Clinical notes stay with the roles that should see them.
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
                Alerts, queue, and pool analytics stay on during the trial.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-3xl">Free while the network grows</h2>
              <p className="mt-3 text-sm leading-6 text-ink-soft">
                Specialty practices get the inbound queue, alerts, and pool analytics at no charge.
                We want specialists on the network first.
              </p>
            </>
          )}
          <Link href="/signup/specialist" className="mt-6 inline-block text-sm font-semibold text-brand">
            {specialistSignupCta()}
          </Link>
        </article>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 md:grid-cols-3">
        {[
          {
            title: "Role-true logins",
            body: "Separate PCP and specialist portals. Physician, midlevel, office manager, and staff each see a different slice of the work.",
          },
          {
            title: "Alerts that land",
            body: `When a referral is sent, ${APP_NAME} fans out SMS and voice alerts to the specialist team according to each person’s preferences.`,
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

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-[32px] border border-line bg-brand-deep px-8 py-10 text-sand md:px-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Walk through a demo
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl text-white">
            Roster accounts are ready if you want to see the product before you create a practice.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
            Synthetic clinic data only. Do not enter real patient information. Demo password is
            printed on each portal sign-in page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login/pcp"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-sand"
            >
              PCP demo portal
            </Link>
            <Link
              href="/login/specialist"
              className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:border-white"
            >
              Specialist demo portal
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-ink-soft">
          <Brand subtitle="Clinical referrals" />
          <div className="flex flex-wrap gap-4">
            <Link className="hover:text-ink" href="/login/pcp">
              PCP sign in
            </Link>
            <Link className="hover:text-ink" href="/login/specialist">
              Specialist sign in
            </Link>
            <Link className="hover:text-ink" href="/signup/pcp">
              Create a practice
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
