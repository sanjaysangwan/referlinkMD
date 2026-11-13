"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { PracticeMark } from "@/components/practice-mark";
import { MobilePhoneText } from "@/components/phone-field";

type Row = {
  id: string;
  createdAt: string;
  status: string;
  consultingName: string;
  consultingPhone?: string;
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

export function ConsultTable({
  mode,
  showIdentifiers,
}: {
  mode: "primary" | "consulting";
  showIdentifiers: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [groupByConsulting, setGroupByConsulting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = mode === "primary" ? "/api/consults" : "/api/inbox";
    void fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setRows(d.consults ?? []);
          setGroupByConsulting(Boolean(d.groupByConsultingClinician));
        }
      });
  }, [mode]);

  const sections = useMemo(() => {
    if (mode !== "consulting" || !groupByConsulting) {
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
  }, [rows, mode, groupByConsulting]);

  function renderRow(r: Row) {
    return (
      <tr key={r.id} className="border-t border-line/30">
        <td className="px-4 py-3 whitespace-nowrap text-muted">
          {new Date(r.createdAt).toLocaleString()}
        </td>
        <td className="px-4 py-3">
          <Link href={`/consults/${r.id}`} className="font-medium text-blue hover:underline">
            {r.patient.firstName} {r.patient.lastName}
          </Link>
          {showIdentifiers && r.patient.dob ? (
            <div className="text-xs text-muted">
              DOB {r.patient.dob}
              {r.patient.contactPhone ? (
                <>
                  {" · "}
                  <MobilePhoneText phone={formatPhone(r.patient.contactPhone)} />
                </>
              ) : null}
            </div>
          ) : (
            <div className="text-xs text-muted">Identifiers limited for this role</div>
          )}
        </td>
        <td className="px-4 py-3">
          {mode === "primary" ? (
            <>
              <div className="font-medium">{r.consultingName}</div>
              {r.consultingPhone ? (
                <div className="text-xs text-muted">
                  <MobilePhoneText phone={formatPhone(r.consultingPhone)} />
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <PracticeMark name={r.practiceName} logo={r.practiceLogo} size={32} />
              <div>
                <div className="font-medium">{r.practiceName}</div>
                <div className="text-xs text-muted">{r.requestedBy}</div>
              </div>
            </div>
          )}
        </td>
        <td className="px-4 py-3 capitalize">{r.status.replaceAll("_", " ")}</td>
      </tr>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="sans text-sm text-orange-800">{error}</p> : null}
      {sections.map((section) => (
        <div key={section.key} className="chart-card overflow-hidden">
          {section.title ? (
            <div className="border-b border-line/30 bg-soft px-4 py-2 text-sm font-semibold text-ink">
              {section.title}
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="sans w-full min-w-[720px] text-left text-sm">
              <thead className="bg-soft text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">{mode === "primary" ? "Consultant" : "From"}</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-muted" colSpan={4}>
                      No consults yet.
                    </td>
                  </tr>
                ) : (
                  section.rows.map(renderRow)
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
