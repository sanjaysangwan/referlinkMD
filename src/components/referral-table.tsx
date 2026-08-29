import Link from "next/link";
import { StatusPill, UrgencyPill } from "@/components/pills";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import type { Referral } from "@/lib/types";

export function ReferralTable({
  referrals,
  hrefBase,
  showDestination,
  showSource,
}: {
  referrals: Referral[];
  hrefBase: string;
  showDestination?: boolean;
  showSource?: boolean;
}) {
  if (referrals.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-12 text-center text-ink-soft">
        No referrals in this view.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-sand/60 text-[11px] uppercase tracking-[0.14em] text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-semibold">Referral</th>
            <th className="px-4 py-3 font-semibold">Patient</th>
            <th className="px-4 py-3 font-semibold">Specialty</th>
            {showDestination ? <th className="px-4 py-3 font-semibold">To</th> : null}
            {showSource ? <th className="px-4 py-3 font-semibold">From</th> : null}
            <th className="px-4 py-3 font-semibold">Urgency</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Opened</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => {
            const patient = db.patientById(r.patientId);
            const dest = db.organizationById(r.specialistOrganizationId);
            const source = db.organizationById(r.referringOrganizationId);
            return (
              <tr key={r.id} className="border-t border-line hover:bg-sand/30">
                <td className="px-4 py-3">
                  <Link className="font-semibold text-harbor" href={`${hrefBase}/${r.id}`}>
                    {r.displayId}
                  </Link>
                </td>
                <td className="px-4 py-3">{patient?.name ?? "—"}</td>
                <td className="px-4 py-3">{r.specialty}</td>
                {showDestination ? <td className="px-4 py-3">{dest?.name}</td> : null}
                {showSource ? <td className="px-4 py-3">{source?.name}</td> : null}
                <td className="px-4 py-3">
                  <UrgencyPill urgency={r.urgency} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={r.status} />
                </td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(r.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-white p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </div>
      <div className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-soft">{hint}</div> : null}
    </div>
  );
}
