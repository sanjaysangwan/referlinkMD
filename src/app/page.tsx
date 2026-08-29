import Link from "next/link";
import { Brand } from "@/components/brand";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Brand subtitle="Clinical referrals" />
        <div className="flex gap-3 text-sm">
          <Link className="rounded-full px-4 py-2 text-ink-soft hover:text-ink" href="/login/pcp">
            PCP sign in
          </Link>
          <Link
            className="rounded-full bg-ink px-4 py-2 text-sand hover:bg-harbor-deep"
            href="/login/specialist"
          >
            Specialist sign in
          </Link>
        </div>
      </header>

      <section className="harbor-grid mx-auto max-w-6xl px-6 pb-10 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-harbor">
          Phase one prototype
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] text-ink md:text-6xl">
          The handoff between primary care and specialty should not go quiet.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          Harbor is a referral workspace for clinics. A PCP sends a patient.
          The specialist practice is alerted by text or phone. Each side can
          see its own patterns over time — with privileges that match MD,
          midlevel, office manager, and staff.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login/pcp"
            className="rounded-full bg-harbor px-6 py-3 text-sm font-semibold text-white hover:bg-harbor-deep"
          >
            Enter primary care
          </Link>
          <Link
            href="/login/specialist"
            className="rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink hover:border-ink/40"
          >
            Enter specialty care
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          {
            title: "Role-true logins",
            body: "Separate PCP and specialist portals. Physician, midlevel, office manager, and staff each see a different slice of the work.",
          },
          {
            title: "Alerts that land",
            body: "When a referral is sent, Harbor fans out SMS and voice alerts to the specialist team according to each person’s preferences.",
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
