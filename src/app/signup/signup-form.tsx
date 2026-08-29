"use client";

import { useActionState } from "react";
import { signupAction, type SignupState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const SPECIALTIES = [
  "Cardiology",
  "Orthopedics",
  "Gastroenterology",
  "Dermatology",
  "Neurology",
  "Pulmonology",
  "Endocrinology",
  "Rheumatology",
  "Oncology",
  "Other",
];

export function SignupForm({ portal }: { portal: "pcp" | "specialist" }) {
  const [state, action] = useActionState<SignupState, FormData>(signupAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="portal" value={portal} />
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Practice name
        </span>
        <input
          name="practiceName"
          required
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-brand/30 focus:ring-2"
          placeholder={portal === "pcp" ? "Riverside Family Medicine" : "Summit Cardiology"}
        />
      </label>
      {portal === "specialist" ? (
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Specialty
          </span>
          <select
            name="specialty"
            required
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
          >
            {SPECIALTIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">City</span>
          <input name="city" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Phone</span>
          <input name="phone" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5" />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Your name</span>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Credentials
          </span>
          <input
            name="credentials"
            placeholder={portal === "pcp" ? "MD, PA-C, NP…" : "MD, NP…"}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Role</span>
          <select name="role" className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5">
            <option value="MD">Physician</option>
            <option value="MIDLEVEL">Midlevel</option>
            <option value="OFFICE_MANAGER">Office manager</option>
            <option value="STAFF">Staff</option>
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Email</span>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
        />
      </label>
      {state?.error ? (
        <p className="rounded-xl bg-[#f8e8e4] px-3 py-2 text-sm text-coral">{state.error}</p>
      ) : null}
      <SubmitButton className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-60">
        {portal === "pcp" ? "Create free practice" : "Start 3-month free trial"}
      </SubmitButton>
    </form>
  );
}
