"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function MfaSetupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/mfa/setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.alreadyEnabled) {
          router.replace(params.get("next") || "/practice");
          return;
        }
        setQr(d.qr ?? "");
        setSecret(d.secret ?? "");
      });
  }, [params, router]);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not enable MFA.");
      return;
    }
    router.push(params.get("next") || "/practice");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="sans text-sm font-medium tracking-[0.2em] text-teal-800 uppercase">Security</p>
      <h1 className="mt-2 text-4xl">Enable authenticator MFA</h1>
      <p className="sans mt-3 text-[#3d4a5c]">
        PHI screens require multi-factor authentication. Scan the code, then enter a 6-digit token.
        Sessions idle out after 15 minutes.
      </p>
      <form onSubmit={confirm} className="sans chart-card mt-8 space-y-4 p-8">
        {qr ? <img src={qr} alt="Authenticator QR code" className="mx-auto" /> : null}
        {secret ? (
          <p className="text-center text-xs text-[#5b6573]">
            Or enter secret <span className="font-mono">{secret}</span>
          </p>
        ) : null}
        <label className="block text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
          Code
          <input
            required
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        <button disabled={busy} className="w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white">
          {busy ? "Verifying…" : "Enable MFA"}
        </button>
      </form>
    </main>
  );
}
