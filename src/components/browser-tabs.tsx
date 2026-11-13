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
    <div role="tablist" aria-label={ariaLabel} className="folder-tabs sans">
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
            className="folder-tab"
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
      className={`folder-panel ${className}`.trim()}
    >
      {children}
    </div>
  );
}
