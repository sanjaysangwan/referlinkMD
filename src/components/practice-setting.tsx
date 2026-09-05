"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/phone";
import { fileToSmallLogo } from "@/lib/practice-logo-file";
import { PracticeMark } from "@/components/practice-mark";
import { isDemo } from "@/lib/env";
import Link from "next/link";
import type { PracticeRole, SessionUser } from "@/lib/types";

type Member = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: PracticeRole;
  roleLabel: string;
  npi: string | null;
  mobilePhone: string | null;
  status: string;
};

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-sm";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export function PracticeSetting({ session }: { session: SessionUser }) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState(session.practiceName ?? "");
  const [logo, setLogo] = useState<string | null>(session.practiceLogo);
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [editingPractice, setEditingPractice] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<PracticeRole>("app");
  const [form, setForm] = useState({ firstName: "", lastName: "", npi: "", mobilePhone: "", role: "physician" as PracticeRole });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function loadPractice() {
    const res = await fetch("/api/practice");
    const data = await res.json();
    if (!res.ok) return;
    setName(data.name ?? "");
    setLogo(data.logo ?? null);
    setPhone(data.phone ?? "");
    setFax(data.fax ?? "");
    setAddressLine1(data.addressLine1 ?? "");
    setCity(data.city ?? "");
    setState(data.state ?? "");
    setPostalCode(data.postalCode ?? "");
  }

  async function loadMembers() {
    const res = await fetch("/api/team");
    const data = await res.json();
    if (res.ok) setMembers(data.members ?? []);
    else setError(data.error ?? "Could not load team.");
  }

  useEffect(() => {
    void loadPractice();
    void loadMembers();
  }, []);

  function startEdit(member: Member) {
    setEditingId(member.id);
    setOk("");
    setError("");
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      npi: member.npi ?? "",
      mobilePhone: member.mobilePhone ?? "",
      role: member.role,
    });
  }

  async function saveMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setBusy(true);
    setError("");
    setOk("");
    const url = editingId === session.id ? "/api/me" : `/api/team/${editingId}`;
    const body =
      editingId === session.id
        ? { firstName: form.firstName, lastName: form.lastName, npi: form.npi, mobilePhone: form.mobilePhone }
        : form;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setOk("Saved.");
    setEditingId(null);
    await loadMembers();
    router.refresh();
  }

  async function savePractice(e: React.FormEvent) {
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
    setLogo(data.logo ?? logo);
    setEditingPractice(false);
    setOk("Practice details saved.");
    router.refresh();
  }

  async function onLogo(file: File | undefined) {
    if (!file) return;
    try {
      setLogo(await fileToSmallLogo(file));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that logo.");
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Invite failed.");
      return;
    }
    setOk("Invite email sent. They create a password from the link.");
    setInviteEmail("");
    void loadMembers();
  }

  return (
    <div className="max-w-2xl">
      <header className="mb-6 flex items-center gap-4">
        <PracticeMark name={name || "Practice"} logo={logo} size={72} />
        <div className="min-w-0 flex-1">
          <p className="sans text-xs font-semibold tracking-[0.18em] text-teal-800 uppercase">Practice</p>
          <h1 className="truncate text-3xl">{name || "Practice"}</h1>
          {city || state ? (
            <p className="sans text-sm text-[#5b6573]">
              {[city, state].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="sans shrink-0 rounded-full border border-[#d8d0c2] px-4 py-2 text-sm font-semibold"
          onClick={() => {
            setEditingPractice((v) => !v);
            setEditingId(null);
            setError("");
            setOk("");
          }}
        >
          {editingPractice ? "Close" : "Edit"}
        </button>
      </header>

      {editingPractice ? (
        <form onSubmit={savePractice} className="sans chart-card mb-6 space-y-4 p-6">
          <h2 className="font-serif text-xl">Practice details</h2>
          <label className={`${label} flex items-center gap-3`}>
            Logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="text-xs"
              onChange={(e) => void onLogo(e.target.files?.[0])}
            />
          </label>
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
          <button disabled={busy} className="rounded-full bg-[#0f1c2e] px-5 py-2.5 text-sm font-semibold text-white">
            {busy ? "Saving…" : "Save practice"}
          </button>
        </form>
      ) : null}

      <article className="chart-card mb-6 p-6">
        <h2 className="font-serif text-xl">People</h2>
        <ul className="sans mt-4 divide-y divide-[#eee6d8]">
          {members.map((m) => (
            <li key={m.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{m.name.trim() || m.email}</p>
                  <p className="text-sm text-[#5b6573]">
                    {m.roleLabel}
                    {m.status === "invited" ? " · Pending email" : ""}
                    {m.id === session.id ? " · You" : ""}
                  </p>
                  <p className="text-xs text-[#5b6573]">{m.email}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-teal-900 hover:bg-[#efe8dc]"
                  onClick={() => {
                    setEditingPractice(false);
                    if (editingId === m.id) setEditingId(null);
                    else startEdit(m);
                  }}
                >
                  {editingId === m.id ? "Close" : "Edit"}
                </button>
              </div>
              {editingId === m.id ? (
                <form onSubmit={saveMember} className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className={label}>
                    First name
                    <input className={field} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  </label>
                  <label className={label}>
                    Last name
                    <input className={field} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  </label>
                  <label className={label}>
                    NPI
                    <input className={field} value={form.npi} onChange={(e) => setForm({ ...form, npi: e.target.value })} />
                  </label>
                  <label className={label}>
                    Mobile
                    <input
                      className={field}
                      value={form.mobilePhone.startsWith("+") ? formatPhone(form.mobilePhone) : form.mobilePhone}
                      onChange={(e) => setForm({ ...form, mobilePhone: e.target.value })}
                    />
                  </label>
                  {m.id !== session.id ? (
                    <label className={`${label} md:col-span-2`}>
                      Credential
                      <select
                        className={field}
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value as PracticeRole })}
                      >
                        <option value="physician">Physician</option>
                        <option value="app">APP (NP / PA)</option>
                        <option value="office_manager">Office staff</option>
                      </select>
                    </label>
                  ) : null}
                  <div className="md:col-span-2">
                    <button disabled={busy} className="rounded-full bg-[#0f1c2e] px-5 py-2 text-sm font-semibold text-white">
                      {busy ? "Saving…" : "Save"}
                    </button>
                  </div>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </article>

      <form onSubmit={invite} className="sans chart-card space-y-3 p-6">
        <h2 className="font-serif text-xl">Invite member</h2>
        <p className="text-xs text-[#5b6573]">
          Sends an email with a link to create a password. No temporary password is included.
        </p>
        <label className={label}>
          Email
          <input
            required
            type="email"
            className={field}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </label>
        <label className={label}>
          Credential
          <select
            className={field}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as PracticeRole)}
          >
            <option value="physician">Physician</option>
            <option value="app">APP (NP / PA)</option>
            <option value="office_manager">Office staff</option>
          </select>
        </label>
        <button disabled={busy} className="w-full rounded-full bg-teal-800 py-2.5 text-sm font-semibold text-white">
          {busy ? "Sending…" : "Send invite"}
        </button>
      </form>

      {error ? <p className="sans mt-4 text-sm text-orange-800">{error}</p> : null}
      {ok ? <p className="sans mt-4 text-sm text-teal-900">{ok}</p> : null}

      {isDemo() ? (
        <p className="sans mt-6 text-sm text-[#5b6573]">
          <Link href="/demo/outbox" className="underline underline-offset-2">
            Demo messages
          </Link>
        </p>
      ) : null}
    </div>
  );
}
