"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-sm";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export function UserProfile() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
        setFirstName(d.firstName ?? "");
        setLastName(d.lastName ?? "");
        setNpi(d.npi ?? "");
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
      body: JSON.stringify({ firstName, lastName, npi, mobilePhone }),
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
      <p className="text-xs text-[#5b6573]">{email}</p>
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
          NPI
          <input className={field} value={npi} onChange={(e) => setNpi(e.target.value)} />
        </label>
        <label className={label}>
          Mobile
          <input
            className={field}
            value={mobilePhone.startsWith("+") ? formatPhone(mobilePhone) : mobilePhone}
            onChange={(e) => setMobilePhone(e.target.value)}
          />
        </label>
      </div>
      {error ? <p className="text-sm text-orange-800">{error}</p> : null}
      {ok ? <p className="text-sm text-teal-900">{ok}</p> : null}
      <button disabled={busy} className="rounded-full bg-[#0f1c2e] px-5 py-2.5 text-sm font-semibold text-white">
        {busy ? "Saving…" : "Save your details"}
      </button>
    </form>
  );
}
