"use client";

import { useActionState, useMemo, useState } from "react";
import { createReferralAction, type ReferralState } from "@/app/actions/referrals";
import { SubmitButton } from "@/components/submit-button";
import type { Organization, Patient } from "@/lib/types";

function Choice({
  name,
  value,
  checked,
  onChange,
  title,
  subtitle,
}: {
  name: string;
  value: string;
  checked?: boolean;
  onChange?: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-paper px-3 py-2.5 has-[:checked]:border-harbor has-[:checked]:bg-mist/70">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        onChange={onChange}
        className="mt-1"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        {subtitle ? <span className="block text-xs text-ink-soft">{subtitle}</span> : null}
      </span>
    </label>
  );
}

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
  const specialties = [...new Set(specialists.map((s) => s.specialty).filter(Boolean))] as string[];
  const [specialty, setSpecialty] = useState(specialties[0] || "");
  const filtered = useMemo(
    () => specialists.filter((s) => !specialty || s.specialty === specialty),
    [specialists, specialty],
  );

  return (
    <form action={action} className="space-y-6 rounded-3xl border border-line bg-white p-6 md:p-8">
      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Patient
        </legend>
        <div className="grid gap-2 md:grid-cols-2">
          {patients.slice(0, 8).map((p, i) => (
            <Choice
              key={p.id}
              name="patientId"
              value={p.id}
              checked={i === 0}
              title={p.name}
              subtitle={`${p.mrn} · ${p.insurance}`}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Specialty
        </legend>
        <div className="flex flex-wrap gap-2">
          {specialties.map((s) => (
            <label
              key={s}
              className="cursor-pointer rounded-full border border-line bg-paper px-3 py-1.5 text-sm has-[:checked]:border-harbor has-[:checked]:bg-mist"
            >
              <input
                type="radio"
                className="sr-only"
                name="specialtyFilter"
                value={s}
                defaultChecked={s === specialty}
                onChange={() => setSpecialty(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset key={specialty} className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Specialist practice
        </legend>
        {filtered.map((s, i) => (
          <Choice
            key={s.id}
            name="specialistOrganizationId"
            value={s.id}
            checked={i === 0}
            title={s.name}
            subtitle={s.city}
          />
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Urgency
        </legend>
        <Choice name="urgency" value="ROUTINE" checked title="Routine" subtitle="Standard routing" />
        <Choice name="urgency" value="SOON" title="Soon" subtitle="Within two weeks" />
        <Choice
          name="urgency"
          value="URGENT"
          title="Urgent"
          subtitle="Text and phone the specialist practice"
        />
      </fieldset>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Reason for referral
        </span>
        <textarea
          name="reason"
          required
          rows={3}
          defaultValue="New syncope with bifascicular block, needs cardiology this week."
          className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5"
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
            defaultValue="BP 148/92. ECG with bifascicular block. Patient reports two near-syncopal episodes."
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2.5"
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
