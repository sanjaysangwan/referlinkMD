"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { MobilePhoneText } from "@/components/phone-field";

type Row = {
  id: string;
  createdAt: string;
  status: string;
  consultingName?: string;
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

export function IncomingConsultCards({
  showIdentifiers,
  groupByConsultingClinician = false,
}: {
  showIdentifiers: boolean;
  groupByConsultingClinician?: boolean;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [grouped, setGrouped] = useState(groupByConsultingClinician);
  const [error, setError] = useState("");

  useEffect(() => {
    function load() {
      void fetch("/api/inbox?new=1")
        .then((r) => r.json())
        .then((d) => {
          if (d.error) setError(d.error);
          else {
            setRows(d.consults ?? []);
            if (typeof d.groupByConsultingClinician === "boolean") {
              setGrouped(d.groupByConsultingClinician);
            }
          }
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

  const sections = useMemo(() => {
    if (!rows?.length) return [];
    if (!grouped) {
      return [{ key: "all", title: null as string | null, rows }];
    }
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const key = (r.consultingName || "Unknown clinician").trim() || "Unknown clinician";
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([title, groupRows]) => ({
      key: title,
      title,
      rows: groupRows,
    }));
  }, [rows, grouped]);

  if (error) return <p className="sans mb-6 text-sm text-orange-800">{error}</p>;
  if (!rows?.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl">{grouped ? "Waiting for your practice" : "Waiting for you"}</h2>
      <p className="sans mt-1 mb-4 text-sm text-[#3d4a5c]">
        {grouped
          ? "Incoming consults for clinicians in your practice, grouped by consulting physician."
          : "Consults sent to you that still need to be resolved."}
      </p>
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.key}>
            {section.title ? (
              <h3 className="sans mb-2 text-sm font-semibold tracking-wide text-[#5b6573] uppercase">
                {section.title}
              </h3>
            ) : null}
            <ul className="sans chart-card divide-y divide-[#ebe4d8] px-4 py-1">
              {section.rows.map((r) => {
                const patientName = `${r.patient.firstName} ${r.patient.lastName}`.trim();
                const line2Parts = [
                  r.practiceName,
                  r.requestedBy || null,
                  new Date(r.createdAt).toLocaleString(),
                  r.status.replaceAll("_", " "),
                ].filter(Boolean);

                return (
                  <li key={r.id}>
                    <Link
                      href={`/consults/${r.id}`}
                      className="block py-3 hover:bg-[#f5f0e8] focus-visible:bg-[#f5f0e8] focus-visible:outline-none"
                    >
                      <p className="text-base font-medium text-teal-900">{patientName}</p>
                      <p className="mt-0.5 text-sm text-[#5b6573]">
                        {showIdentifiers && r.patient.dob ? (
                          <>
                            DOB {r.patient.dob}
                            {r.patient.contactPhone ? (
                              <>
                                {" · "}
                                <MobilePhoneText phone={formatPhone(r.patient.contactPhone)} />
                              </>
                            ) : null}
                            {" · "}
                          </>
                        ) : null}
                        {line2Parts.join(" · ")}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
