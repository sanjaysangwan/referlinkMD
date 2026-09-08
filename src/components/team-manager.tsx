"use client";

import { useEffect, useState } from "react";
import { formatPhone } from "@/lib/phone";
import { MobilePhoneText } from "@/components/phone-field";
import type { PracticeRole } from "@/lib/types";

type Member = {
  id: string;
  name: string;
  email: string;
  role: PracticeRole;
  roleLabel: string;
  npi: string | null;
  mobilePhone: string | null;
  status: string;
};

export function TeamManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PracticeRole>("app");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/team");
    const data = await res.json();
    if (res.ok) setMembers(data.members ?? []);
    else setError(data.error ?? "Could not load team.");
  }

  useEffect(() => {
    void load();
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Invite failed.");
      return;
    }
    setOk("Invite email sent. They create a password from the link (see Demo inbox).");
    setEmail("");
    void load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="chart-card overflow-hidden">
        <table className="sans w-full text-left text-sm">
          <thead className="bg-[#efe8dc] text-xs tracking-wide text-[#5b6573] uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t border-[#eee6d8]">
                <td className="px-4 py-3">
                  <div className="font-medium">{m.name.trim() || m.email}</div>
                  <div className="text-xs text-[#5b6573]">{m.email}</div>
                  {m.npi || m.mobilePhone ? (
                    <div className="text-xs text-[#5b6573]">
                      {m.npi ? `NPI ${m.npi}` : ""}
                      {m.npi && m.mobilePhone ? " · " : ""}
                      {m.mobilePhone ? <MobilePhoneText phone={formatPhone(m.mobilePhone)} /> : null}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3">{m.roleLabel}</td>
                <td className="px-4 py-3 capitalize">{m.status === "invited" ? "Pending email" : m.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={invite} className="sans chart-card h-fit space-y-3 p-6">
        <h2 className="font-serif text-xl">Invite staff</h2>
        <p className="text-xs text-[#5b6573]">
          Sends an email with a link to create a password. No temporary password is included.
        </p>
        <label className="block text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
          Email
          <input
            required
            type="email"
            className="mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
          Credential
          <select
            className="mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as PracticeRole)}
          >
            <option value="physician">Physician</option>
            <option value="app">APP (NP / PA)</option>
            <option value="office_manager">Office staff</option>
          </select>
        </label>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        {ok ? <p className="text-sm text-teal-900">{ok}</p> : null}
        <button disabled={busy} className="w-full rounded-full bg-teal-800 py-2.5 text-sm font-semibold text-white">
          {busy ? "Sending…" : "Send invite email"}
        </button>
      </form>
    </div>
  );
}
