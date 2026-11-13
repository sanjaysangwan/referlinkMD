"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DisclosureCard } from "@/components/disclosure-card";

export function LeavePracticeCard({ practiceName }: { practiceName: string | null }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const practice = practiceName ?? "this practice";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      setTyped("");
      setError("");
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  function openDialog() {
    setTyped("");
    setError("");
    const dialog = dialogRef.current;
    dialog?.showModal();
    dialog?.querySelector("input")?.focus();
  }

  async function leave() {
    if (typed !== "confirm") return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/practice/leave", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not leave the practice.");
      return;
    }
    dialogRef.current?.close();
    router.push(data.home ?? "/create-practice");
    router.refresh();
  }

  return (
    <>
      <DisclosureCard title="Leave practice">
        <p className="text-sm text-muted">
          Remove yourself from {practice}. You keep your login and can create a new practice or join
          another only via invite. This cannot be undone.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={openDialog}
          className="rounded-full border border-orange-300 px-5 py-2.5 text-sm font-semibold text-orange-950 hover:bg-orange-50 disabled:opacity-60"
        >
          Leave practice
        </button>
      </DisclosureCard>
      <dialog
        ref={dialogRef}
        aria-labelledby="leave-practice-title"
        className="sans fixed top-1/2 left-1/2 m-0 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line/40 bg-white p-6 text-ink backdrop:bg-ink/40 [&:not([open])]:hidden"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <h3 id="leave-practice-title" className="font-serif text-xl">
          Leave {practice}
        </h3>
        <p className="mt-2 text-sm text-muted">
          This action is irreversible. Type confirm to leave {practice}.
        </p>
        <label className="label mt-4">
          Type confirm
          <input
            className="field mt-1"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </label>
        {error ? <p className="mt-3 text-sm text-orange-800">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || typed !== "confirm"}
            onClick={() => void leave()}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Leaving…" : "Leave practice"}
          </button>
        </div>
      </dialog>
    </>
  );
}
