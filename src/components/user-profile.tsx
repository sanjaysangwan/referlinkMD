"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneField } from "@/components/phone-field";
import type { PracticeRole } from "@/lib/types";

const field = "field mt-1";
const label = "label";

export function UserProfile() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PracticeRole | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [npi, setNpi] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setEmail(d.email ?? "");
        setRole(d.role ?? null);
        setFirstName(d.firstName ?? "");
        setLastName(d.lastName ?? "");
        setNpi(d.role === "physician" ? (d.npi ?? "") : "");
        setMobilePhone(d.mobilePhone ?? "");
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        mobilePhone,
        ...(role === "physician" ? { npi } : {}),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save profile.");
      return;
    }
    setOk("Your details were saved.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="sans chart-card mb-6 space-y-4 p-6">
      <h2 className="font-serif text-xl">Your details</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={label}>
          First name
          <input className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label className={label}>
          Last name
          <input className={field} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label className={label}>
          Email
          <input required type="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={label}>
          Mobile
          <div className="mt-1">
            <PhoneField mobile value={mobilePhone} onChange={setMobilePhone} />
          </div>
        </label>
        {role === "physician" ? (
          <label className={label}>
            NPI
            <input className={field} value={npi} onChange={(e) => setNpi(e.target.value)} />
          </label>
        ) : null}
      </div>
      {error ? <p className="text-sm text-orange-800">{error}</p> : null}
      {ok ? <p className="text-sm text-blue">{ok}</p> : null}
      <button disabled={busy} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
        {busy ? "Saving…" : "Save your details"}
      </button>
    </form>
  );
}
