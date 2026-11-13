"use client";

import { useState } from "react";
import { DisclosureCard } from "@/components/disclosure-card";

const field = "field mt-1";
const label = "label";

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canChooseNew = currentPassword.length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword: password }),
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
    <DisclosureCard title="Change password">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink">Password requirements</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>At least 10 characters</li>
          </ul>
        </div>
        <label className={label}>
          Current password
          <input
            required
            type="password"
            className={field}
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (error) setError("");
            }}
            autoComplete="current-password"
          />
        </label>
        <label className={label}>
          New password
          <input
            required
            type="password"
            minLength={10}
            disabled={!canChooseNew}
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className={label}>
          Confirm new password
          <input
            required
            type="password"
            minLength={10}
            disabled={!canChooseNew}
            className={field}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        <button
          disabled={busy || !canChooseNew}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </DisclosureCard>
  );
}
