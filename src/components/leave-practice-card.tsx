"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LeavePracticeCard({ practiceName }: { practiceName: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function leave() {
    if (
      !window.confirm(
        `Leave ${practiceName ?? "this practice"}? You can still sign in, then create your own practice or accept an invite.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/practice/leave", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not leave the practice.");
      return;
    }
    router.push(data.home ?? "/create-practice");
    router.refresh();
  }

  return (
    <section className="sans chart-card space-y-3 p-6">
      <h2 className="font-serif text-xl">Leave practice</h2>
      <p className="text-sm text-[#5b6573]">
        Remove yourself from {practiceName ?? "this practice"}. You keep your login and can create a
        new practice or join another only via invite.
      </p>
      {error ? <p className="text-sm text-orange-800">{error}</p> : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void leave()}
        className="rounded-full border border-orange-300 px-5 py-2.5 text-sm font-semibold text-orange-950 hover:bg-orange-50 disabled:opacity-60"
      >
        {busy ? "Leaving…" : "Leave practice"}
      </button>
    </section>
  );
}
