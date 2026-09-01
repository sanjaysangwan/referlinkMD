import Link from "next/link";
import { Brand } from "@/components/brand";
import { SignupForm } from "../signup-form";

export default function SpecialistSignup() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <section className="hidden flex-col justify-between bg-brand-deep p-12 text-sand lg:flex">
        <Brand light subtitle="Specialty care" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            For the specialist team
          </p>
          <h1 className="mt-3 max-w-md text-5xl leading-[1.05] text-white">
            Know when a patient is on the way.
          </h1>
          <p className="mt-5 max-w-md text-white/75">
            Alerts, the inbound queue, and care patterns stay in one place so the
            specialist team can pick up the handoff.
          </p>
        </div>
        <p className="text-sm text-white/50">
          Synthetic demo data only if you use the roster. New signups start empty.
        </p>
      </section>
      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand subtitle="Specialty care" />
          </div>
          <h2 className="text-3xl">Create a specialist practice</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Already on ReferLinkMD?{" "}
            <Link className="font-semibold text-brand" href="/login/specialist">
              Sign in
            </Link>
          </p>
          <div className="mt-8">
            <SignupForm portal="specialist" />
          </div>
        </div>
      </section>
    </div>
  );
}
