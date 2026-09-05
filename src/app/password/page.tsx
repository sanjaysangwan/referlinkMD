"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not change password.");
      return;
    }
    router.push(data.home ?? "/mfa/setup");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-4xl">Choose a new password</h1>
      <p className="sans mt-3 text-[#3d4a5c]">Temporary passwords must be changed before you can open patient information.</p>
      <form onSubmit={submit} className="sans chart-card mt-8 space-y-4 p-8">
        <label className="block text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
          New password (min 10 characters)
          <input
            required
            type="password"
            minLength={10}
            className="mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        <button disabled={busy} className="w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white">
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </main>
  );
}
