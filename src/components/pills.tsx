import type { ReferralStatus, Urgency } from "@/lib/types";
import { statusLabel, urgencyLabel } from "@/lib/format";

const statusClass: Record<ReferralStatus, string> = {
  DRAFT: "bg-sand text-ink-soft",
  SUBMITTED: "bg-mist text-brand-deep",
  ALERTED: "bg-[#e8f1ee] text-brand-deep",
  ACCEPTED: "bg-[#e7f3ea] text-ok",
  SCHEDULED: "bg-[#e7eef8] text-[#2a4d7a]",
  COMPLETED: "bg-mist text-ink-soft",
  DECLINED: "bg-[#f8e8e4] text-coral",
};

const urgencyClass: Record<Urgency, string> = {
  ROUTINE: "bg-sand text-ink-soft",
  SOON: "bg-[#f7eedc] text-gold",
  URGENT: "bg-[#f8e8e4] text-coral",
};

export function StatusPill({ status }: { status: ReferralStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${statusClass[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

export function UrgencyPill({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${urgencyClass[urgency]}`}>
      {urgencyLabel(urgency)}
    </span>
  );
}

export function RolePill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-mist px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-brand-deep">
      {label}
    </span>
  );
}
