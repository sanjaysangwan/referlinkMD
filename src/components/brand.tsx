export function HarborMark({ className = "mark" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden="true"
    >
      <rect width="34" height="34" rx="9" fill="#1B6B63" />
      <path
        d="M7 22.5V12.5c0-1.2.9-2.2 2.1-2.4L17 8.5l7.9 1.6c1.2.2 2.1 1.2 2.1 2.4v10"
        stroke="#F3ECE1"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M6 24h22"
        stroke="#CDE6E1"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="17" cy="16.5" r="1.7" fill="#F3ECE1" />
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
      <HarborMark />
      <div className="leading-tight">
        <div className={`text-[17px] font-semibold tracking-tight ${light ? "text-white" : "text-ink"}`}>
          Harbor
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
