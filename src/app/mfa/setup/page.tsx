"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneField } from "@/components/phone-field";

type Method = "totp" | "sms" | null;

function MfaSetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/practice";

  const [method, setMethod] = useState<Method>(null);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [phone, setPhone] = useState("");
  const [maskedMobile, setMaskedMobile] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [demoCode, setDemoCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/auth/mfa/setup")
      .then((r) => r.json())
      .then((d) => {
        if (d.alreadyEnabled) {
          router.replace(next);
          return;
        }
        if (d.mobilePhone) setPhone(d.mobilePhone);
        if (d.maskedMobile) setMaskedMobile(d.maskedMobile);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [next, router]);

  async function startTotp() {
    setBusy(true);
    setError("");
    setMethod("totp");
    const res = await fetch("/api/auth/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "totp", step: "start" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not start authenticator setup.");
      setMethod(null);
      return;
    }
    setQr(data.qr ?? "");
    setSecret(data.secret ?? "");
    setCode("");
  }

  async function confirmTotp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "totp", step: "confirm", code }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not enable MFA.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function sendSms(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    setMethod("sms");
    const res = await fetch("/api/auth/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "sms", step: "send", phone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send SMS code.");
      return;
    }
    setSmsSent(true);
    setMaskedMobile(data.maskedMobile ?? null);
    setDemoCode(data.demoCode ?? "");
    if (data.demoCode) setCode(data.demoCode);
  }

  async function confirmSms(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "sms", step: "confirm", code, phone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not enable MFA.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p role="status">Loading security setup...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="sans text-sm font-medium tracking-[0.2em] text-teal-800 uppercase">Security</p>
      <h1 className="mt-2 text-4xl">Enable multi-factor authentication</h1>
      <p className="sans mt-3 text-[#3d4a5c]">
        PHI screens require MFA. Choose an authenticator app or a one-time code by SMS. Sessions idle
        out after 15 minutes.
      </p>

      {!method ? (
        <div className="sans chart-card mt-8 space-y-3 p-8">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startTotp()}
            className="w-full rounded-xl border border-[#d8d0c2] bg-white px-4 py-4 text-left hover:border-teal-800"
          >
            <span className="block text-sm font-semibold text-[#0f1c2e]">Authenticator app</span>
            <span className="mt-1 block text-sm text-[#5b6573]">
              Use Google Authenticator, Authy, or a similar app.
            </span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMethod("sms");
              setError("");
              setSmsSent(false);
              setCode("");
              setDemoCode("");
            }}
            className="w-full rounded-xl border border-[#d8d0c2] bg-white px-4 py-4 text-left hover:border-teal-800"
          >
            <span className="block text-sm font-semibold text-[#0f1c2e]">Text message (SMS)</span>
            <span className="mt-1 block text-sm text-[#5b6573]">
              Receive a 6-digit code on your mobile phone.
            </span>
          </button>
          {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        </div>
      ) : null}

      {method === "totp" ? (
        <form onSubmit={confirmTotp} className="sans chart-card mt-8 space-y-4 p-8">
          <button
            type="button"
            className="text-sm text-teal-900 underline-offset-2 hover:underline"
            onClick={() => {
              setMethod(null);
              setQr("");
              setSecret("");
              setCode("");
              setError("");
            }}
          >
            ← Choose a different method
          </button>
          {qr ? <img src={qr} alt="Authenticator QR code" className="mx-auto" /> : null}
          {secret ? (
            <p className="text-center text-xs text-[#5b6573]">
              Or enter secret <span className="font-mono">{secret}</span>
            </p>
          ) : null}
          <label className="block text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
            Authenticator code
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-orange-800">{error}</p> : null}
          <button
            disabled={busy}
            className="w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Enable authenticator MFA"}
          </button>
        </form>
      ) : null}

      {method === "sms" ? (
        <form
          onSubmit={smsSent ? confirmSms : sendSms}
          className="sans chart-card mt-8 space-y-4 p-8"
        >
          <button
            type="button"
            className="text-sm text-teal-900 underline-offset-2 hover:underline"
            onClick={() => {
              setMethod(null);
              setSmsSent(false);
              setCode("");
              setDemoCode("");
              setError("");
            }}
          >
            ← Choose a different method
          </button>
          {!smsSent ? (
            <label className="block text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
              Mobile phone
              <div className="mt-1">
                <PhoneField mobile required value={phone} onChange={setPhone} />
              </div>
            </label>
          ) : (
            <>
              <p className="text-sm text-[#3d4a5c]">
                We sent a 6-digit code to{" "}
                <span className="font-semibold">{maskedMobile ?? "your phone"}</span>.
              </p>
              <label className="block text-xs font-semibold tracking-wide text-[#5b6573] uppercase">
                SMS code
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </label>
              {demoCode ? (
                <p className="text-xs text-[#5b6573]">
                  Demo code: <span className="font-mono font-semibold">{demoCode}</span> (also in Demo
                  inbox)
                </p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => void sendSms()}
                className="text-sm text-teal-900 underline-offset-2 hover:underline"
              >
                Resend code
              </button>
            </>
          )}
          {error ? <p className="text-sm text-orange-800">{error}</p> : null}
          <button
            disabled={busy}
            className="w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy
              ? smsSent
                ? "Verifying…"
                : "Sending…"
              : smsSent
                ? "Enable SMS MFA"
                : "Send SMS code"}
          </button>
        </form>
      ) : null}
    </main>
  );
}

export default function MfaSetupPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-6 py-16">
          <p role="status">Loading security setup...</p>
        </main>
      }
    >
      <MfaSetupForm />
    </Suspense>
  );
}
