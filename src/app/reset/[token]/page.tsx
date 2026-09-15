"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { APP_NAME } from "@/lib/brand";

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return password.length >= 10 && password === confirm && !busy;
  }, [password, confirm, busy]);

  async function updatePassword() {
    if (!canSubmit) {
      setError(
        password !== confirm
          ? "Passwords do not match."
          : "Enter a new password with at least 10 characters.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not reset password.");
      return;
    }
    window.location.assign("/login?reset=1");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <p className="sans text-center text-sm font-medium tracking-[0.16em] text-teal-800">{APP_NAME}</p>
      <h1 className="mt-2 text-center text-4xl">Choose a new password</h1>
      <p className="sans mx-auto mt-3 text-center text-[#3d4a5c]">
        Enter a new password for your {APP_NAME} account. The link expires after one hour. Your
        current password stays valid until you click Update password.
      </p>
      <form
        autoComplete="off"
        className="sans chart-card mt-8 space-y-4 p-8"
        onSubmit={(e) => {
          // Never POST on Enter / autofill submit — only the button click below.
          e.preventDefault();
        }}
      >
        <label className={label}>
          New password (min 10 characters)
          <input
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
          type="button"
          disabled={!canSubmit}
          onClick={() => void updatePassword()}
          className="w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
        <p className="text-center text-sm text-[#3d4a5c]">
          <Link href="/login" className="text-teal-900 underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
