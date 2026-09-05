"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { PracticeMark } from "@/components/practice-mark";

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
  const [error, setError] = useState("");

  useEffect(() => {
    const url = mode === "primary" ? "/api/consults" : "/api/inbox";
    void fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setRows(d.consults ?? []);
      });
  }, [mode]);

  return (
    <div className="chart-card overflow-hidden">
      {error ? <p className="sans p-4 text-sm text-orange-800">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="sans w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#efe8dc] text-xs tracking-wide text-[#5b6573] uppercase">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">{mode === "primary" ? "Consultant" : "From"}</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-[#5b6573]" colSpan={4}>
                  No consults yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-[#eee6d8]">
                  <td className="px-4 py-3 whitespace-nowrap text-[#5b6573]">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/consults/${r.id}`} className="font-medium text-teal-900 hover:underline">
                      {r.patient.firstName} {r.patient.lastName}
                    </Link>
                    {showIdentifiers && r.patient.dob ? (
                      <div className="text-xs text-[#5b6573]">
                        DOB {r.patient.dob}
                        {r.patient.contactPhone ? ` · ${formatPhone(r.patient.contactPhone)}` : ""}
                      </div>
                    ) : (
                      <div className="text-xs text-[#5b6573]">Identifiers limited for this role</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {mode === "primary" ? (
                      <>
                        <div className="font-medium">{r.consultingName}</div>
                        {r.consultingPhone ? (
                          <div className="text-xs text-[#5b6573]">{formatPhone(r.consultingPhone)}</div>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <PracticeMark name={r.practiceName} logo={r.practiceLogo} size={32} />
                        <div>
                          <div className="font-medium">{r.practiceName}</div>
                          <div className="text-xs text-[#5b6573]">{r.requestedBy}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{r.status.replaceAll("_", " ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
