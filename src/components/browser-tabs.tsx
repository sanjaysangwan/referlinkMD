"use client";

import type { ReactNode } from "react";

export type BrowserTab = {
  id: string;
  label: string;
};

export function BrowserTabList({
  tabs,
  activeId,
  onChange,
  "aria-label": ariaLabel,
}: {
  tabs: BrowserTab[];
  activeId: string;
  onChange: (id: string) => void;
  "aria-label": string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="sans flex items-end gap-1 border-b border-[#e4ddd0]"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active ? 0 : -1}
            className={
              active
                ? "-mb-px rounded-t-xl border border-b-0 border-[#e4ddd0] bg-[#fffdf8] px-4 py-2.5 text-sm font-semibold text-[#0f1c2e]"
                : "rounded-t-xl px-4 py-2.5 text-sm font-semibold text-[#5b6573] hover:bg-[#efe8dc] hover:text-[#0f1c2e]"
            }
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function BrowserTabPanel({
  id,
  activeId,
  children,
  className = "",
}: {
  id: string;
  activeId: string;
  children: ReactNode;
  className?: string;
}) {
  const active = id === activeId;
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!active}
      className={className}
    >
      {children}
    </div>
  );
}
