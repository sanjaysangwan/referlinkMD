"use client";

import { useActionState, useMemo, useState } from "react";
import { createReferralAction, type ReferralState } from "@/app/actions/referrals";
import { SubmitButton } from "@/components/submit-button";
import type { Organization, Patient } from "@/lib/types";

export function NewReferralForm({
  patients,
  specialists,
  showClinical,
}: {
  patients: Patient[];
  specialists: Organization[];
  showClinical: boolean;
}) {
  const [state, action] = useActionState<ReferralState, FormData>(createReferralAction, null);
  const [specialty, setSpecialty] = useState(specialists[0]?.specialty || "");
  const filtered = useMemo(
    () => specialists.filter((s) => !specialty || s.specialty === specialty),
    [specialists, specialty],
  );
  const specialties = [...new Set(specialists.map((s) => s.specialty).filter(Boolean))] as string[];

  return (
    <form action={action} className="space-y-5 rounded-3xl border border-line bg-white p-6 md:p-8">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Patient</span>
        <select
          name="patientId"
          required
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5"
        >
          <option value="">Select a chart</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.mrn} · {p.insurance}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Specialty
          </span>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5"
          >
            {specialties.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Specialist practice
          </span>
          <select
            name="specialistOrganizationId"
            required
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5"
          >
            {filtered.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.city}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">Urgency</span>
        <select name="urgency" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5">
          <option value="ROUTINE">Routine</option>
          <option value="SOON">Soon (within 2 weeks)</option>
          <option value="URGENT">Urgent — text and phone the specialist</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Reason for referral
        </span>
        <textarea
          name="reason"
          required
          rows={3}
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5"
          placeholder="Why this patient needs specialty care"
        />
      </label>

      {showClinical ? (
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Clinical summary
          </span>
          <textarea
            name="clinicalSummary"
            rows={4}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5"
            placeholder="Pertinent history, meds, studies. Hidden from staff logins."
          />
        </label>
      ) : (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink-soft">
          Staff logins send the administrative referral. Clinical summaries stay with MD and midlevel.
        </p>
      )}

      {state?.error ? (
        <p className="rounded-xl bg-[#f8e8e4] px-3 py-2 text-sm text-coral">{state.error}</p>
      ) : null}

      <SubmitButton className="rounded-full bg-harbor px-6 py-3 text-sm font-semibold text-white hover:bg-harbor-deep disabled:opacity-60">
        Send referral and alert specialist
      </SubmitButton>
    </form>
  );
}
