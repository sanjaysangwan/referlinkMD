import Link from "next/link";
import { Brand } from "@/components/brand";
import { SignupForm } from "../signup-form";

export default function PcpSignup() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <section className="hidden flex-col justify-between bg-ink p-12 text-sand lg:flex">
        <Brand light subtitle="Primary care" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Always free</p>
          <h1 className="mt-3 max-w-md text-5xl leading-[1.05] text-white">
            Referrals should not cost the practice that starts them.
          </h1>
          <p className="mt-5 max-w-md text-white/75">
            Primary care signs up at no charge. Send patients, track patterns, and keep clinical
            notes with the roles you already have.
          </p>
        </div>
        <p className="text-sm text-white/50">Synthetic demo data only if you use the roster. New signups start empty.</p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand subtitle="Primary care" />
          </div>
          <h2 className="text-3xl">Create a free PCP practice</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Already on ReferLink?{" "}
            <Link className="font-semibold text-brand" href="/login/pcp">
              Sign in
            </Link>
          </p>
          <div className="mt-8">
            <SignupForm portal="pcp" />
          </div>
        </div>
      </section>
    </div>
  );
}
