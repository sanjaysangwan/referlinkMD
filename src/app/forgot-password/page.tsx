"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

const COOLDOWN_MS = 2 * 60 * 1000;
const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unregisteredEmail, setUnregisteredEmail] = useState("");
  const [message, setMessage] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const remainingMs = cooldownUntil ? Math.max(0, cooldownUntil - now) : 0;
  const onCooldown = remainingMs > 0;
  const sent = Boolean(message);

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  useEffect(() => {
    if (cooldownUntil && remainingMs <= 0) {
      setCooldownUntil(null);
    }
  }, [cooldownUntil, remainingMs]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (onCooldown || busy) return;
    setBusy(true);
    setError("");
    setUnregisteredEmail("");
    setMessage("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send reset email.");
      if (data.registered === false && data.email) {
        setUnregisteredEmail(String(data.email));
      }
      setCooldownUntil(null);
      return;
    }
    setMessage(data.message ?? "Check your email for a reset link.");
    setCooldownUntil(Date.now() + COOLDOWN_MS);
    setNow(Date.now());
  }

  const buttonLabel = busy
    ? "Sending…"
    : onCooldown
      ? `Resend password reset email (${formatCountdown(remainingMs)})`
      : sent
        ? "Resend password reset email"
        : "Email me a reset link";

  const createLoginHref = unregisteredEmail
    ? `/login?mode=create&email=${encodeURIComponent(unregisteredEmail)}`
    : "/login?mode=create";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <p className="sans text-center text-sm font-medium tracking-[0.16em] text-teal-800">{APP_NAME}</p>
      <h1 className="mt-2 text-center text-4xl">Forgot password</h1>
      <p className="sans mx-auto mt-3 text-center text-[#3d4a5c]">
        Enter your account email. We’ll send a secure link to choose a new password.
      </p>
      <form onSubmit={submit} className="sans chart-card mt-8 space-y-4 p-8">
        <label className={label}>
          Email
          <input
            required
            type="email"
            className={field}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setUnregisteredEmail("");
              setError("");
            }}
            autoComplete="username"
          />
        </label>
        {error ? (
          <p className="text-sm text-orange-800">
            {error}
            {unregisteredEmail ? (
              <>
                {" "}
                <Link href={createLoginHref} className="font-semibold underline underline-offset-2">
                  Create Login
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
        {message ? <p className="text-sm text-teal-900">{message}</p> : null}
        <button
          disabled={busy || onCooldown}
          className="w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {buttonLabel}
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
