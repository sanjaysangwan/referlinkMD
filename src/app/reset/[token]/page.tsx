"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { APP_NAME } from "@/lib/brand";

const field = "field mt-1";
const label = "label";

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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-10">
      <p className="sans text-center text-sm font-medium tracking-[0.16em] text-blue">{APP_NAME}</p>
      <h1 className="mt-2 text-center text-2xl">Choose a new password</h1>
      <p className="sans mx-auto mt-3 text-center text-muted">
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
          className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
        <p className="text-center text-sm text-muted">
          <Link href="/login" className="text-blue underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
