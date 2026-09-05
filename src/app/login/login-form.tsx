"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_MFA_SECRET, DEMO_PASSWORD } from "@/lib/env";
import type { PracticeRole } from "@/lib/types";

const demos = [
  { email: "elena@referlink.demo", label: "Harbor — Elena Vasquez, MD" },
  { email: "jordan@referlink.demo", label: "Harbor — Jordan Hale, NP" },
  { email: "priya@referlink.demo", label: "Harbor — Priya Shah, office staff" },
  { email: "david@referlink.demo", label: "Riverside — David Okonkwo, MD" },
  { email: "amina@referlink.demo", label: "Riverside — Amina Patel, PA-C" },
];

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "create">(params.get("mode") === "create" ? "create" : "signin");
  const [email, setEmail] = useState(mode === "signin" ? "elena@referlink.demo" : "");
  const [password, setPassword] = useState(mode === "signin" ? DEMO_PASSWORD : "");
  const [practiceName, setPracticeName] = useState("");
  const [role, setRole] = useState<PracticeRole>("physician");
  const [code, setCode] = useState("");
  const [mfa, setMfa] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: "signin" | "create") {
    setMode(next);
    setError("");
    setMfa(false);
    if (next === "signin") {
      setEmail("elena@referlink.demo");
      setPassword(DEMO_PASSWORD);
    } else {
      setEmail("");
      setPassword("");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (mfa) {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        return;
      }
      router.push(params.get("next") || data.home);
      router.refresh();
      return;
    }

    if (mode === "create") {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, practiceName, role }),
      });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) {
        setError(data.error ?? "Could not create practice.");
        return;
      }
      router.push(data.home ?? "/mfa/setup");
      router.refresh();
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Unable to sign in.");
      return;
    }
    if (data.mfaRequired) {
      setMfa(true);
      setDemoCode(data.demoCode ?? "");
      if (data.demoCode) setCode(data.demoCode);
      return;
    }
    router.push(params.get("next") || data.home);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="sans chart-card mx-auto w-full max-w-lg p-8">
      {!mfa ? (
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-full bg-[#efe8dc] p-1">
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === "signin" ? "bg-teal-800 text-white" : "text-[#3d4a5c]"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("create")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === "create" ? "bg-teal-800 text-white" : "text-[#3d4a5c]"}`}
          >
            New practice
          </button>
        </div>
      ) : null}

      {mfa ? (
        <>
          <label className={label}>
            Authenticator code
            <input
              className={field}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </label>
          <p className="mt-2 text-xs text-[#5b6573]">
            Demo accounts share authenticator secret <span className="font-mono">{DEMO_MFA_SECRET}</span>
            {demoCode ? (
              <>
                . Current demo code: <span className="font-mono font-semibold">{demoCode}</span>
              </>
            ) : null}
          </p>
        </>
      ) : (
        <>
          <label className={label}>
            Email
            <input
              required
              type="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className={`mt-4 ${label}`}>
            Password
            <input
              required
              type="password"
              minLength={mode === "create" ? 10 : 1}
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "create" ? "new-password" : "current-password"}
            />
          </label>
          {mode === "create" ? (
            <>
              <p className="mt-1 text-xs text-[#5b6573]">At least 10 characters.</p>
              <label className={`mt-4 ${label}`}>
                Practice name
                <input
                  required
                  className={field}
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                />
              </label>
              <label className={`mt-4 ${label}`}>
                Your credential
                <select
                  className={field}
                  value={role}
                  onChange={(e) => setRole(e.target.value as PracticeRole)}
                >
                  <option value="physician">Physician</option>
                  <option value="app">APP (NP / PA)</option>
                  <option value="office_manager">Office staff</option>
                </select>
              </label>
              <p className="mt-2 text-xs text-[#3d4a5c]">
                This creates your practice and your login together. Add a logo, phone, fax, and
                staff after you sign in.
              </p>
            </>
          ) : null}
        </>
      )}

      {error ? <p className="mt-4 text-sm text-orange-800">{error}</p> : null}

      <button disabled={busy} className="mt-6 w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Please wait…" : mfa ? "Verify" : mode === "create" ? "Create practice" : "Sign in"}
      </button>

      {!mfa && mode === "signin" ? (
        <>
          <p className="mt-6 text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
            Demo accounts (password: {DEMO_PASSWORD})
          </p>
          <ul className="mt-2 space-y-1">
            {demos.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  className="text-left text-sm text-teal-900 underline-offset-2 hover:underline"
                  onClick={() => setEmail(a.email)}
                >
                  {a.label} · {a.email}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </form>
  );
}
