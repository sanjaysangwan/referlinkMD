"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { ROLE_LABEL } from "@/lib/privileges";
import type { SessionUser } from "@/lib/types";
import { PhoneField, MobilePhoneText } from "@/components/phone-field";

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-sm";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

function Row({ caption, value }: { caption: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-[#5b6573] uppercase">{caption}</p>
      <div className="mt-1 text-base text-[#0f1c2e]">{value || "—"}</div>
    </div>
  );
}

export function MemberProfileCard({ session }: { session: SessionUser }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(session.firstName);
  const [lastName, setLastName] = useState(session.lastName);
  const [npi, setNpi] = useState(session.npi ?? "");
  const [mobilePhone, setMobilePhone] = useState(session.mobilePhone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = `${session.firstName} ${session.lastName}`.trim() || session.email;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, npi, mobilePhone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save your details.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form onSubmit={save} className="sans chart-card max-w-lg space-y-4 p-6">
        <h2 className="font-serif text-xl">Edit your details</h2>
        <p className="text-xs text-[#5b6573]">{session.email}</p>
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
            <div className="mt-1">
              <PhoneField mobile value={mobilePhone} onChange={setMobilePhone} />
            </div>
          </label>
        </div>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        <div className="flex gap-2">
          <button
            disabled={busy}
            className="rounded-full bg-[#0f1c2e] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#5b6573]"
            onClick={() => {
              setEditing(false);
              setError("");
              setFirstName(session.firstName);
              setLastName(session.lastName);
              setNpi(session.npi ?? "");
              setMobilePhone(session.mobilePhone ?? "");
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="sans chart-card max-w-lg p-6">
      <p className="text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">Your profile</p>
      <h2 className="mt-2 font-serif text-2xl">{name}</h2>
      <div className="mt-5 grid gap-4">
        <Row caption="Email" value={session.email} />
        {session.role ? <Row caption="Credential" value={ROLE_LABEL[session.role]} /> : null}
        {session.practiceName ? <Row caption="Practice" value={session.practiceName} /> : null}
        <Row caption="NPI" value={session.npi ?? ""} />
        <Row
          caption="Mobile"
          value={
            session.mobilePhone ? <MobilePhoneText phone={formatPhone(session.mobilePhone)} /> : ""
          }
        />
      </div>
      <button
        type="button"
        className="mt-8 w-full rounded-full bg-[#0f1c2e] px-5 py-2.5 text-sm font-semibold text-white"
        onClick={() => setEditing(true)}
      >
        Edit
      </button>
    </article>
  );
}
