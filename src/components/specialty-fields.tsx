"use client";

import { useEffect, useMemo, useState } from "react";

export type SpecialtyOption = {
  id: string;
  name: string;
  subspecialties: Array<{ id: string; name: string }>;
};

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-sm";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export function SpecialtyFields({
  specialtyId,
  subspecialtyId,
  onChange,
  className,
  specialtyRequired = false,
}: {
  specialtyId: string;
  subspecialtyId: string;
  onChange: (next: { specialtyId: string; subspecialtyId: string }) => void;
  className?: string;
  specialtyRequired?: boolean;
}) {
  const [options, setOptions] = useState<SpecialtyOption[]>([]);

  useEffect(() => {
    void fetch("/api/specialties")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.specialties) setOptions(d.specialties);
      })
      .catch(() => undefined);
  }, []);

  const subs = useMemo(() => {
    const selected = options.find((s) => s.id === specialtyId);
    return selected?.subspecialties ?? [];
  }, [options, specialtyId]);

  return (
    <div className={className ?? "grid gap-3 md:grid-cols-2"}>
      <label className={label}>
        Specialty
        <select
          required={specialtyRequired}
          className={field}
          value={specialtyId}
          onChange={(e) => onChange({ specialtyId: e.target.value, subspecialtyId: "" })}
        >
          <option value="">Select specialty</option>
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        Subspecialty
        <select
          className={field}
          value={subspecialtyId}
          disabled={!specialtyId || !subs.length}
          onChange={(e) => onChange({ specialtyId, subspecialtyId: e.target.value })}
        >
          <option value="">{subs.length ? "None (optional)" : specialtyId ? "No subspecialties" : "Choose specialty first"}</option>
          {subs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
