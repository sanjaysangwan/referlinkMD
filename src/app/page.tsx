import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="sans text-sm font-medium tracking-[0.16em] text-teal-800">{APP_NAME}</p>
      <h1 className="mt-3 max-w-3xl text-5xl leading-tight font-medium text-[#0f1c2e]">
        Peer-to-peer consults. A practice asks. A clinician answers.

      </h1>
      <p className="sans mt-5 max-w-2xl text-lg leading-relaxed text-[#3d4a5c]">
        {APP_NAME} lets a practice request a consult by texting a secure link to any clinician&apos;s
        mobile. Every physician is labeled the same. Who is primary vs consulting depends on the
        patient — not a PCP/specialist directory. Patient information is limited to name, date of
        birth, and phone. There is no note writing.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/login" className="sans rounded-full bg-teal-800 px-6 py-3 text-sm font-semibold text-white">
          Sign in
        </Link>
        <Link
          href="/login?mode=create"
          className="sans rounded-full border border-[#cfc6b6] bg-white px-6 py-3 text-sm font-semibold text-[#0f1c2e]"
        >
          Create a practice
        </Link>
      </div>
      <section className="mt-16 grid gap-4 md:grid-cols-3">
        <article className="chart-card p-6">
          <h2 className="text-2xl">Request</h2>
          <p className="sans mt-2 text-sm leading-relaxed text-[#3d4a5c]">
            Physician, APP, or office staff enters patient identifiers and the consulting
            clinician&apos;s cell number.
          </p>
        </article>
        <article className="chart-card p-6">
          <h2 className="text-2xl">Secure text</h2>
          <p className="sans mt-2 text-sm leading-relaxed text-[#3d4a5c]">
            SMS never includes patient name, DOB, or phone — only a 24-hour link and the requesting
            clinician&apos;s public name.
          </p>
        </article>
        <article className="chart-card p-6">
          <h2 className="text-2xl">Consultant</h2>
          <p className="sans mt-2 text-sm leading-relaxed text-[#3d4a5c]">
            New clinicians set up a minimum account. Existing users sign in. Then patient identifiers
            appear on the portal.
          </p>
        </article>
      </section>
    </main>
  );
}
