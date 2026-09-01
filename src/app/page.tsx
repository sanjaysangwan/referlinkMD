import Link from "next/link";
import { Brand } from "@/components/brand";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand subtitle="Clinical referrals" />
        <div className="flex gap-3 text-sm">
          <Link className="rounded-full px-4 py-2 text-ink-soft hover:text-ink" href="/signup/pcp">
            Primary care signup
          </Link>
          <Link className="rounded-full px-4 py-2 text-ink-soft hover:text-ink" href="/login/pcp">
            Sign in
          </Link>
          <Link
            className="rounded-full bg-ink px-4 py-2 text-sand hover:bg-brand-deep"
            href="/signup/specialist"
          >
            Specialist signup
          </Link>
        </div>
      </header>

      <section className="brand-grid mx-auto max-w-6xl px-6 pb-10 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand">
          Phase one prototype
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-ink md:text-6xl">
          The handoff between primary team and specialist should not be a burden.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          ReferLinkMD keeps the patient in view after a referral leaves the office.
          The primary team sends the patient. The specialist practice is alerted by
          text or phone so care can continue. Each side can see how that handoff is
          going — with privileges that match physician, midlevel, office manager,
          and staff.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup/pcp"
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-deep"
          >
            Join as primary care
          </Link>
          <Link
            href="/signup/specialist"
            className="rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink hover:border-ink/40"
          >
            Join as specialty care
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-8 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Primary care</p>
          <h2 className="mt-3 text-3xl">Stay with the patient after you refer</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            The primary team starts the handoff, invites physician, midlevel, office
            manager, and staff, and can still see where each patient is going.
          </p>
          <Link href="/signup/pcp" className="mt-6 inline-block text-sm font-semibold text-brand">
            Open a primary care workspace
          </Link>
        </article>
        <article className="rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Specialty care</p>
          <h2 className="mt-3 text-3xl">Know when a patient is on the way</h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            When a referral is sent, the specialist team is alerted by text or phone.
            The inbound queue and care patterns stay in one place for the whole practice.
          </p>
          <Link href="/signup/specialist" className="mt-6 inline-block text-sm font-semibold text-brand">
            Open a specialty workspace
          </Link>
        </article>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          {
            title: "Roles that match the care team",
            body: "Separate primary care and specialist portals. Physician, midlevel, office manager, and staff each see the slice of the patient’s handoff they are responsible for.",
          },
          {
            title: "Alerts that reach the next clinician",
            body: "When a patient is referred, ReferLinkMD sends text and phone alerts to the specialist team according to each person’s preferences, so care does not stall.",
          },
          {
            title: "The patient’s path, not just a queue",
            body: "Primary teams see where their patients go. Specialists see who is entrusting them with care — urgency and how the handoff continues over twelve months.",
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
