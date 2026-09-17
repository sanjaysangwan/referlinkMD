"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

type Preview = {
  email: string;
  practiceName: string;
  role: string;
  needsPassword: boolean;
  currentPracticeName: string | null;
};

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
  });

  useEffect(() => {
    void fetch(`/api/invites/accept?token=${encodeURIComponent(params.token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setPreview(d as Preview);
      })
      .catch(() => setError("Could not load this invite."));
  }, [params.token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: params.token,
        firstName: form.firstName,
        lastName: form.lastName,
        ...(preview?.needsPassword ? { password: form.password } : {}),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not activate this invite.");
      return;
    }
    router.push(data.home ?? "/mfa/setup");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-4xl">{preview?.needsPassword ? "Create your password" : "Join this practice"}</h1>
      <p className="sans mt-3 text-[#3d4a5c]">
        {preview ? (
          <>
            You were invited to <strong>{preview.practiceName}</strong>
            {preview.currentPracticeName ? (
              <>
                . Accepting will move you from <strong>{preview.currentPracticeName}</strong> to this
                practice.
              </>
            ) : (
              <>.</>
            )}
          </>
        ) : (
          "Loading invite…"
        )}
      </p>
      <form onSubmit={submit} className="sans chart-card mt-8 space-y-4 p-8">
        {preview?.needsPassword ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                First name
                <input
                  className={field}
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </label>
              <label className={label}>
                Last name
                <input
                  className={field}
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </label>
            </div>
            <label className={label}>
              Password (min 10 characters)
              <input
                required
                type="password"
                minLength={10}
                className={field}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
          </>
        ) : (
          <p className="text-sm text-[#5b6573]">
            This invite is for {preview?.email}. Confirm to join {preview?.practiceName}
            {preview?.currentPracticeName ? " (you will leave your current practice)" : ""}.
          </p>
        )}
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        <button
          disabled={busy || !preview}
          className="w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy
            ? "Saving…"
            : preview?.needsPassword
              ? "Activate login"
              : preview?.currentPracticeName
                ? "Move to this practice"
                : "Join practice"}
        </button>
      </form>
    </main>
  );
}
