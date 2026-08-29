function maxCount(data: { count: number }[]) {
  return Math.max(...data.map((d) => d.count), 1);
}

export function TrendChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  const max = maxCount(data);
  const w = 720;
  const h = 240;
  const padX = 28;
  const padY = 22;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const coords = data.map((d, i) => {
    const x = padX + (data.length === 1 ? innerW / 2 : (i * innerW) / (data.length - 1));
    const y = padY + innerH - (d.count / max) * innerH;
    return { x, y, ...d };
  });
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `${padX},${padY + innerH} ${line} ${padX + innerW},${padY + innerH}`;

  return (
    <div className="pt-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-64 w-full" role="img" aria-label="Referrals over time">
        <path d={`M${area}Z`} fill="#1B6B63" opacity="0.08" />
        <polyline
          fill="none"
          stroke="#1B6B63"
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
        />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r="3.2" fill="#134e48" />
        ))}
        {coords.map((c, i) =>
          i % 2 === 0 ? (
            <text key={`${c.label}-t`} x={c.x} y={h - 4} textAnchor="middle" fill="#3d5164" fontSize="11">
              {c.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}

export function BarsChart({
  data,
}: {
  data: { name?: string; label?: string; count: number }[];
}) {
  const max = maxCount(data);
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-soft">No volume in this view.</p>;
  }
  return (
    <div className="space-y-3 pt-4">
      {data.map((row) => {
        const label = row.name ?? row.label ?? "";
        const width = Math.max(6, Math.round((row.count / max) * 100));
        return (
          <div key={label}>
            <div className="mb-1 flex justify-between text-xs text-ink-soft">
              <span>{label}</span>
              <span>{row.count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PALETTE = ["#1B6B63", "#C45C4A", "#B8893D", "#2A4D7A", "#2F7D4A", "#6B4F3A"];

export function DonutChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  const r = 70;
  const c = 2 * Math.PI * r;
  const slices = data.reduce<{ name: string; count: number; len: number; offset: number; color: string }[]>(
    (acc, d, i) => {
      const len = (d.count / total) * c;
      const offset = acc.reduce((sum, s) => sum + s.len, 0);
      acc.push({ name: d.name, count: d.count, len, offset, color: PALETTE[i % PALETTE.length] });
      return acc;
    },
    [],
  );

  return (
    <div className="flex flex-col items-center gap-4 pt-2 md:flex-row">
      <svg viewBox="0 0 200 200" className="h-52 w-52" role="img" aria-label="Status mix">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#f3ece1" strokeWidth="22" />
        {slices.map((d) => (
          <circle
            key={d.name}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="22"
            strokeDasharray={`${d.len} ${c - d.len}`}
            strokeDashoffset={-d.offset}
            transform="rotate(-90 100 100)"
          />
        ))}
        <text x="100" y="96" textAnchor="middle" fill="#102033" fontSize="22" fontFamily="var(--font-fraunces)">
          {total}
        </text>
        <text x="100" y="116" textAnchor="middle" fill="#3d5164" fontSize="11">
          referrals
        </text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span>
              {d.name} · {d.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
