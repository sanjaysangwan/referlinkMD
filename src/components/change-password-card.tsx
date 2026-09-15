"use client";

import { useState } from "react";

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-sm";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export function ChangePasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBusy(false);
      setError(data.error ?? "Could not change password.");
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.assign("/login?reset=1");
  }

  return (
    <form onSubmit={submit} className="sans chart-card max-w-lg space-y-4 p-6">
      <h2 className="font-serif text-xl">Change password</h2>
      <p className="text-xs text-[#5b6573]">Use a strong password you do not reuse elsewhere.</p>
      <label className={label}>
        New password (min 10 characters)
        <input
          required
          type="password"
          minLength={10}
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      <label className={label}>
        Confirm password
        <input
          required
          type="password"
          minLength={10}
          className={field}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      {error ? <p className="text-sm text-orange-800">{error}</p> : null}
      <button
        disabled={busy}
        className="rounded-full bg-[#0f1c2e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
