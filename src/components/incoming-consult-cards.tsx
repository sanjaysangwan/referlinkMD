"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { PracticeMark } from "@/components/practice-mark";

type Row = {
  id: string;
  createdAt: string;
  status: string;
  requestedBy: string;
  practiceName: string;
  practiceLogo?: string | null;
  patient: {
    firstName: string;
    lastName: string;
    dob?: string | null;
    contactPhone?: string | null;
  };
};

export function IncomingConsultCards({ showIdentifiers }: { showIdentifiers: boolean }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    function load() {
      void fetch("/api/inbox?new=1")
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else setRows(d.consults ?? []);
        });
    }
    load();
    const id = window.setInterval(load, 15_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (error) return <p className="sans mb-6 text-sm text-orange-800">{error}</p>;
  if (!rows?.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl">Waiting for you</h2>
      <p className="sans mt-1 mb-4 text-sm text-[#3d4a5c]">Consults sent to you that still need to be resolved.</p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={`/consults/${r.id}`} className="chart-card flex items-start gap-4 p-5 hover:border-teal-800">
              <PracticeMark name={r.practiceName} logo={r.practiceLogo} size={44} />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-xl">
                  {r.patient.firstName} {r.patient.lastName}
                </p>
                {showIdentifiers && r.patient.dob ? (
                  <p className="sans mt-1 text-sm text-[#3d4a5c]">
                    DOB {r.patient.dob}
                    {r.patient.contactPhone ? ` · ${formatPhone(r.patient.contactPhone)}` : ""}
                  </p>
                ) : (
                  <p className="sans mt-1 text-xs text-[#5b6573]">Open to see patient identifiers</p>
                )}
                <p className="sans mt-2 text-sm text-[#3d4a5c]">
                  {r.practiceName}
                  {r.requestedBy ? ` · ${r.requestedBy}` : ""}
                </p>
                <p className="sans mt-1 text-xs text-[#5b6573]">
                  {new Date(r.createdAt).toLocaleString()} · {r.status.replaceAll("_", " ")}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
