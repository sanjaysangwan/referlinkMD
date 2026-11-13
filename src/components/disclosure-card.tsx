"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export function DisclosureCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group sans chart-card w-full">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5 text-xl text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue [&::-webkit-details-marker]:hidden">
        <span className="font-serif">{title}</span>
        <ChevronDown
          size={18}
          className="shrink-0 text-muted transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 px-6 pb-6">{children}</div>
    </details>
  );
}
