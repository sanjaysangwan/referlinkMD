"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { ROLE_LABEL } from "@/lib/privileges";
import type { SessionUser } from "@/lib/types";
import { PhoneField, MobilePhoneText } from "@/components/phone-field";
import { SpecialtyFields } from "@/components/specialty-fields";

const field = "field mt-1";
const label = "label";

function Row({ caption, value }: { caption: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{caption}</p>
      <div className="mt-1 text-base text-ink">{value || "—"}</div>
    </div>
  );
}

export function MemberProfileCard({ session }: { session: SessionUser }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(session.firstName);
  const [lastName, setLastName] = useState(session.lastName);
  const [email, setEmail] = useState(session.email);
  const [npi, setNpi] = useState(session.npi ?? "");
  const [mobilePhone, setMobilePhone] = useState(session.mobilePhone ?? "");
  const [specialtyId, setSpecialtyId] = useState(session.specialtyId ?? "");
  const [subspecialtyId, setSubspecialtyId] = useState(session.subspecialtyId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const name = `${session.firstName} ${session.lastName}`.trim() || session.email;
  const isPhysician = session.role === "physician";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body: Record<string, unknown> = { firstName, lastName, email, mobilePhone };
    if (isPhysician) {
      body.npi = npi;
      body.specialtyId = specialtyId || null;
      body.subspecialtyId = specialtyId ? subspecialtyId || null : null;
    }
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  function resetForm() {
    setEditing(false);
    setError("");
    setFirstName(session.firstName);
    setLastName(session.lastName);
    setEmail(session.email);
    setNpi(session.npi ?? "");
    setMobilePhone(session.mobilePhone ?? "");
    setSpecialtyId(session.specialtyId ?? "");
    setSubspecialtyId(session.subspecialtyId ?? "");
  }

  if (editing) {
    return (
      <form onSubmit={save} className="sans chart-card w-full space-y-4 p-6">
        <h2 className="font-serif text-xl">Edit your details</h2>
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
            <input
              required
              type="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className={label}>
            Mobile
            <div className="mt-1">
              <PhoneField mobile value={mobilePhone} onChange={setMobilePhone} />
            </div>
          </label>
          {isPhysician ? (
            <label className={label}>
              NPI
              <input className={field} value={npi} onChange={(e) => setNpi(e.target.value)} />
            </label>
          ) : null}
        </div>
        {isPhysician ? (
          <SpecialtyFields
            specialtyId={specialtyId}
            subspecialtyId={subspecialtyId}
            onChange={({ specialtyId: nextSpec, subspecialtyId: nextSub }) => {
              setSpecialtyId(nextSpec);
              setSubspecialtyId(nextSub);
            }}
          />
        ) : null}
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        <div className="flex gap-2">
          <button
            disabled={busy}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink"
            onClick={resetForm}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="sans chart-card w-full p-6">
      <p className="text-xs font-semibold tracking-[0.18em] text-blue uppercase">Your profile</p>
      <h2 className="mt-2 font-serif text-2xl">{name}</h2>
      <div className="mt-5 grid gap-4">
        <Row caption="Email" value={session.email} />
        {session.role ? <Row caption="Credential" value={ROLE_LABEL[session.role]} /> : null}
        {session.practiceName ? <Row caption="Practice" value={session.practiceName} /> : null}
        {isPhysician ? <Row caption="Specialty" value={session.specialtyLabel ?? ""} /> : null}
        {isPhysician ? <Row caption="NPI" value={session.npi ?? ""} /> : null}
        <Row
          caption="Mobile"
          value={
            session.mobilePhone ? <MobilePhoneText phone={formatPhone(session.mobilePhone)} /> : ""
          }
        />
      </div>
      <button
        type="button"
        className="mt-8 w-full rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
        onClick={() => setEditing(true)}
      >
        Edit
      </button>
    </article>
  );
}
