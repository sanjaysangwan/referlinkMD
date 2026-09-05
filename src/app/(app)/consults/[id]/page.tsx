"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { PracticeMark } from "@/components/practice-mark";

type Detail = {
  id: string;
  status: string;
  createdAt: string;
  team: string;
  primaryTeam: {
    practiceName: string;
    logo: string | null;
    clinician: string;
    npi: string | null;
    phone: string;
    fax: string;
  };
  consultingTeam: { name: string; phone: string };
  patient: {
    firstName: string;
    lastName: string;
    dob: string | null;
    contactPhone: string | null;
    isSynthetic: boolean;
  };
};

export default function ConsultDetailPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<Detail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch(`/api/consults/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRow(d);
      });
  }, [params.id]);

  if (error) return <p className="sans text-orange-800">{error}</p>;
  if (!row) return <p className="sans text-sm text-[#5b6573]">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <p className="sans text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">Consult</p>
      <h1 className="mt-2 text-3xl">
        {row.patient.firstName} {row.patient.lastName}
      </h1>
      <p className="sans mt-1 text-sm capitalize text-[#5b6573]">{row.status.replaceAll("_", " ")}</p>

      <section className="chart-card mt-6 p-6">
        <h2 className="text-xl">Patient</h2>
        {row.patient.isSynthetic ? (
          <p className="sans mt-1 text-xs font-medium text-amber-800">Synthetic demo patient</p>
        ) : null}
        <p className="mt-3 text-2xl">
          {row.patient.firstName} {row.patient.lastName}
        </p>
        {row.patient.dob && row.patient.contactPhone ? (
          <p className="sans mt-2 text-sm text-[#3d4a5c]">
            DOB {row.patient.dob} · {formatPhone(row.patient.contactPhone)}
          </p>
        ) : (
          <p className="sans mt-2 text-sm text-[#5b6573]">
            Date of birth and phone are limited to physicians and APPs.
          </p>
        )}
        <p className="sans mt-4 text-xs text-[#5b6573]">This product does not store consult notes.</p>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="chart-card p-6">
          <h2 className="text-lg">Requesting practice</h2>
          <div className="mt-3 flex items-start gap-3">
            <PracticeMark name={row.primaryTeam.practiceName} logo={row.primaryTeam.logo} size={48} />
            <div>
              <p>{row.primaryTeam.clinician}</p>
              <p className="sans text-sm text-[#3d4a5c]">{row.primaryTeam.practiceName}</p>
              {row.primaryTeam.npi ? <p className="sans text-xs text-[#5b6573]">NPI {row.primaryTeam.npi}</p> : null}
              <p className="sans mt-1 text-xs text-[#5b6573]">
                Phone {formatPhone(row.primaryTeam.phone)}
                {row.primaryTeam.fax ? ` · Fax ${formatPhone(row.primaryTeam.fax)}` : ""}
              </p>
            </div>
          </div>
        </section>
        <section className="chart-card p-6">
          <h2 className="text-lg">Consultant</h2>
          <p className="mt-2">{row.consultingTeam.name}</p>
          <p className="sans text-sm text-[#3d4a5c]">{formatPhone(row.consultingTeam.phone)}</p>
        </section>
      </div>
    </div>
  );
}
