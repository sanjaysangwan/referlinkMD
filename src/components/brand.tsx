import { APP_NAME } from "@/lib/constants";

export function ReferLinkMDMark({ className = "mark" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden="true"
    >
      <rect width="34" height="34" rx="9" fill="#1B6B63" />
      <circle cx="11" cy="17" r="3.2" stroke="#F3ECE1" strokeWidth="1.7" />
      <circle cx="23" cy="17" r="3.2" stroke="#F3ECE1" strokeWidth="1.7" />
      <path d="M14.2 17h5.6" stroke="#CDE6E1" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({
  light = false,
  subtitle,
}: {
  light?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <ReferLinkMDMark />
      <div className="leading-tight">
        <div className={`text-[17px] font-semibold tracking-tight ${light ? "text-white" : "text-ink"}`}>
          {APP_NAME}
        </div>
        {subtitle ? (
          <div className={`text-[11px] uppercase tracking-[0.16em] ${light ? "text-white/70" : "text-ink-soft"}`}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
