"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { fileToSmallLogo } from "@/lib/practice-logo-file";
import { PracticeMark } from "@/components/practice-mark";

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-sm";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export function PracticeProfile() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    const res = await fetch("/api/practice");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load practice.");
      return;
    }
    setName(data.name ?? "");
    setPhone(data.phone ?? "");
    setFax(data.fax ?? "");
    setLogo(data.logo ?? null);
    setAddressLine1(data.addressLine1 ?? "");
    setCity(data.city ?? "");
    setState(data.state ?? "");
    setPostalCode(data.postalCode ?? "");
  }

  useEffect(() => {
    void load();
  }, []);

  async function onLogo(file: File | undefined) {
    if (!file) return;
    try {
      setLogo(await fileToSmallLogo(file));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that logo.");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch("/api/practice", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, fax, logo, addressLine1, city, state, postalCode }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not update practice.");
      return;
    }
    setName(data.name ?? name);
    setPhone(data.phone ?? phone);
    setFax(data.fax ?? fax);
    setLogo(data.logo ?? logo);
    setOk("Practice details saved.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="sans chart-card mb-6 space-y-4 p-6">
      <h2 className="font-serif text-xl">Practice details</h2>
      <div className="flex items-center gap-3">
        <PracticeMark name={name || "Practice"} logo={logo} size={56} />
        <label className={`${label} flex-1`}>
          Logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="mt-2 text-xs"
            onChange={(e) => void onLogo(e.target.files?.[0])}
          />
        </label>
      </div>
      <label className={label}>
        Practice name
        <input required className={field} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={label}>
          Phone
          <input
            className={field}
            value={phone.startsWith("+") ? formatPhone(phone) : phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className={label}>
          Fax
          <input
            className={field}
            value={fax.startsWith("+") ? formatPhone(fax) : fax}
            onChange={(e) => setFax(e.target.value)}
          />
        </label>
      </div>
      <label className={label}>
        Address
        <input className={field} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className={label}>
          City
          <input className={field} value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <label className={label}>
          State
          <input maxLength={2} className={field} value={state} onChange={(e) => setState(e.target.value)} />
        </label>
        <label className={label}>
          ZIP
          <input className={field} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </label>
      </div>
      {error ? <p className="text-sm text-orange-800">{error}</p> : null}
      {ok ? <p className="text-sm text-teal-900">{ok}</p> : null}
      <button disabled={busy} className="rounded-full bg-[#0f1c2e] px-5 py-2.5 text-sm font-semibold text-white">
        {busy ? "Saving…" : "Save practice"}
      </button>
    </form>
  );
}
