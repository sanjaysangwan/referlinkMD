"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export default function CreatePracticePage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    practiceName: "",
    postalCode: "",
    role: "physician",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/practice/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create practice.");
      return;
    }
    router.push(data.home ?? "/consults");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl">Create your practice</h1>
      <p className="sans mt-2 mb-6 text-sm text-[#3d4a5c]">
        You are not on a practice right now. Create one, or join another practice only through an
        invite email.
      </p>
      <form onSubmit={submit} className="sans chart-card space-y-4 p-6">
        <label className={label}>
          Practice name
          <input
            required
            className={field}
            value={form.practiceName}
            onChange={(e) => setForm({ ...form, practiceName: e.target.value })}
            placeholder="Harbor Family Medicine"
          />
        </label>
        <label className={label}>
          ZIP code
          <input
            required
            className={field}
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            placeholder="04101"
          />
        </label>
        <label className={label}>
          Your credential
          <select
            className={field}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="physician">Physician</option>
            <option value="app">APP (NP / PA)</option>
            <option value="office_manager">Office staff</option>
          </select>
        </label>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        <button
          disabled={busy}
          className="w-full rounded-full bg-teal-800 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create practice"}
        </button>
      </form>
      <p className="sans mt-4 text-sm text-[#5b6573]">
        Waiting on an invite? Check your email, then open the link to join.{" "}
        <Link href="/consults" className="text-teal-900 underline-offset-2 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
