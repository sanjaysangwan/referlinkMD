"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const field =
  "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base text-[#0f1c2e]";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

function formatPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join("-");
}
export function NewConsultForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patientFirstName: "",
    patientLastName: "",
    patientDob: "",
    patientPhone: "",
    consultingName: "",
    consultingPhone: "",
    consultPriority: "urgent",
    consultRequestComment: "",
  });

  const [matches, setMatches] = useState<Array<{ id: string; firstName: string; lastName: string; mobilePhone: string | null; npi: string | null }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  useEffect(() => {
    if (!searching || form.consultingName.trim().length < 2) return;
    const controller = new AbortController();
    setMatches([]);
    setSearchStatus("Searching...");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/consultants?q=" + encodeURIComponent(form.consultingName.trim()), { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        if (controller.signal.aborted) return;
        setMatches(data.consultants);
        setSearchStatus(data.consultants.length ? "Select a consultant to fill their details." : "No match. Enter the consultant's mobile below to invite them.");
      } catch {
        if (!controller.signal.aborted) setSearchStatus("Search unavailable. You can enter details manually.");
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [form.consultingName, searching]);
  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/consults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not request consult.");
      return;
    }
    router.push(`/consults/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="sans chart-card max-w-xl space-y-4 p-6">
      <label className={label}>
        Consulting clinician name
        <input required className={field} value={form.consultingName} autoComplete="off" onChange={(e) => { setForm((f) => ({ ...f, consultingName: e.target.value, consultingPhone: "" })); setSearching(true); }} onFocus={() => setSearching(true)} onKeyDown={(e) => { if (e.key === "Escape") setSearching(false); }} placeholder="David Okonkwo, MD" />
      </label>
      {searching && form.consultingName.trim().length >= 2 ? (
        <div className="rounded-xl border border-[#d8d0c2] bg-white p-2" aria-label="Matching consultants">
          {matches.map((person) => (
            <button type="button" key={person.id} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-teal-50 focus:bg-teal-50"
              onClick={() => {
                setForm((f) => ({ ...f, consultingName: person.firstName + " " + person.lastName, consultingPhone: formatPhoneInput(person.mobilePhone ?? "") }));
                setSearching(false);
              }}>
              <span className="block font-semibold">{person.firstName} {person.lastName}</span>
              <span className="text-xs text-gray-600">{person.mobilePhone ? formatPhoneInput(person.mobilePhone) : "Mobile not added"}</span>
            </button>
          ))}
          <p role="status" className="px-3 py-2 text-sm text-gray-600">{searchStatus}</p>
        </div>
      ) : null}
      <label className={label}>
        Consulting mobile
        <input required type="tel" inputMode="tel" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" title="Enter a 10-digit phone number: xxx-xxx-xxxx" className={field} value={form.consultingPhone} onChange={(e) => set("consultingPhone", formatPhoneInput(e.target.value))} placeholder="xxx-xxx-xxxx" />
      </label>
      <label className={label}>
        Urgency
        <select required className={field} value={form.consultPriority} onChange={(e) => set("consultPriority", e.target.value)}>
          <option value="immediate">Immediate</option>
          <option value="urgent">Urgent</option>
          <option value="routine">Routine</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Patient first name
          <input required className={field} value={form.patientFirstName} onChange={(e) => set("patientFirstName", e.target.value)} />
        </label>
        <label className={label}>
          Patient last name
          <input required className={field} value={form.patientLastName} onChange={(e) => set("patientLastName", e.target.value)} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Date of birth
          <input required type="date" className={field} value={form.patientDob} onChange={(e) => set("patientDob", e.target.value)} />
        </label>
        <label className={label}>
          Patient phone
          <input required className={field} value={form.patientPhone} type="tel" inputMode="tel" pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" title="Enter a 10-digit phone number: xxx-xxx-xxxx" onChange={(e) => set("patientPhone", formatPhoneInput(e.target.value))} placeholder="555-010-0001" />
        </label>
      </div>
      <label className={label}>
        Comment (optional)
        <textarea className={field} rows={3} maxLength={2000} value={form.consultRequestComment} onChange={(e) => set("consultRequestComment", e.target.value)} placeholder="Add a comment for the consultant" />
      </label>
      {error ? <p className="text-sm text-orange-800">{error}</p> : null}
      <button disabled={busy} className="rounded-full bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Sending secure link…" : "Request consult"}
      </button>
      <p className="text-xs leading-relaxed text-[#5b6573]">
        Patient details and your comment stay in the secure portal. The consultant
        receives a text with a secure link — no patient identifiers in the SMS.
      </p>
    </form>
  );
}
