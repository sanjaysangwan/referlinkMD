"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_MFA_SECRET, DEMO_PASSWORD } from "@/lib/env";
import { formatZipDisplay, isValidUsZip } from "@/lib/practice-identity";
import type { PracticeRole } from "@/lib/types";

const demos = [
  { email: "elena@referlink.demo", label: "Harbor — Elena Vasquez, MD" },
  { email: "jordan@referlink.demo", label: "Harbor — Jordan Hale, NP" },
  { email: "priya@referlink.demo", label: "Harbor — Priya Shah, office staff" },
  { email: "david@referlink.demo", label: "Riverside — David Okonkwo, MD" },
  { email: "amina@referlink.demo", label: "Riverside — Amina Patel, PA-C" },
];

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base";
const fieldDisabled =
  "mt-1 w-full rounded-xl border border-[#e5dfd4] bg-[#f3eee6] px-3 py-2 text-base text-[#8a8790] disabled:cursor-not-allowed";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

type PracticeMatch = {
  id: string;
  name: string;
  postalCode: string;
  postalCodeDisplay?: string;
  city?: string;
  state?: string;
  label?: string;
  nameZipKey?: string | null;
  admin: { name: string; email: string; phone: string | null } | null;
};

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "create">(params.get("mode") === "create" ? "create" : "signin");
  const initialEmail =
    params.get("email")?.trim() || (params.get("mode") === "create" ? "" : "elena@referlink.demo");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(mode === "signin" ? DEMO_PASSWORD : "");
  const [practiceName, setPracticeName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [role, setRole] = useState<PracticeRole>("physician");
  const [code, setCode] = useState("");
  const [mfa, setMfa] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "sms">("totp");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [practiceMatches, setPracticeMatches] = useState<PracticeMatch[]>([]);
  const [existingPractice, setExistingPractice] = useState<PracticeMatch | null>(null);
  const [practiceChecking, setPracticeChecking] = useState(false);
  const [showPracticeSuggestions, setShowPracticeSuggestions] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimName, setClaimName] = useState("");
  const [claimNote, setClaimNote] = useState("");
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");

  const zipOk = isValidUsZip(postalCode);
  const practiceAvailable =
    mode === "create" &&
    practiceName.trim().length >= 2 &&
    zipOk &&
    !practiceChecking &&
    !existingPractice;

  function resetCreatePracticeState() {
    setPracticeName("");
    setPostalCode("");
    setPracticeMatches([]);
    setExistingPractice(null);
    setPracticeChecking(false);
    setShowPracticeSuggestions(false);
    setShowClaimForm(false);
    setClaimEmail("");
    setClaimName("");
    setClaimNote("");
    setClaimMessage("");
  }

  function switchMode(next: "signin" | "create") {
    setMode(next);
    setError("");
    setMfa(false);
    resetCreatePracticeState();
    if (next === "signin") {
      setEmail("elena@referlink.demo");
      setPassword(DEMO_PASSWORD);
    } else {
      setEmail("");
      setPassword("");
      setRole("physician");
    }
  }

  useEffect(() => {
    if (mode !== "create") return;
    const q = practiceName.trim();
    if (q.length < 2) {
      setPracticeMatches([]);
      setExistingPractice(null);
      setPracticeChecking(false);
      return;
    }

    const controller = new AbortController();
    setPracticeChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const zipParam = postalCode.trim() ? `&zip=${encodeURIComponent(postalCode.trim())}` : "";
        const res = await fetch(`/api/practices/lookup?q=${encodeURIComponent(q)}${zipParam}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("lookup failed");
        const data = await res.json();
        if (controller.signal.aborted) return;
        setPracticeMatches(data.practices ?? []);
        setExistingPractice(data.exact ?? null);
        if (data.exact) setShowClaimForm(false);
      } catch {
        if (!controller.signal.aborted) {
          setPracticeMatches([]);
          setExistingPractice(null);
        }
      } finally {
        if (!controller.signal.aborted) setPracticeChecking(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [mode, practiceName, postalCode]);

  function selectPractice(match: PracticeMatch) {
    setPracticeName(match.name);
    setPostalCode(match.postalCode || "");
    setExistingPractice(match);
    setPracticeMatches([match]);
    setShowPracticeSuggestions(false);
    setShowClaimForm(false);
    setClaimMessage("");
    setError("");
  }

  async function submitClaim() {
    if (!existingPractice) return;
    setClaimBusy(true);
    setClaimMessage("");
    setError("");
    const res = await fetch("/api/practices/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        practiceId: existingPractice.id,
        claimantEmail: claimEmail,
        claimantName: claimName,
        note: claimNote,
      }),
    });
    const data = await res.json();
    setClaimBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not submit claim.");
      return;
    }
    setClaimMessage(data.message ?? "Claim request sent.");
    setShowClaimForm(false);
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
      if (existingPractice) {
        setBusy(false);
        setError("This practice already exists. Contact the administrator listed above to request addition.");
        return;
      }
      if (!practiceAvailable) {
        setBusy(false);
        setError(
          !zipOk
            ? "Enter a valid 5-digit ZIP code with the practice name."
            : "Enter a practice name and ZIP that are not already registered together.",
        );
        return;
      }
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, practiceName, postalCode, role }),
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
      setMfaMethod(data.mfaMethod === "sms" ? "sms" : "totp");
      setMaskedMobile(data.maskedMobile ?? "");
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
            Create Login
          </button>
        </div>
      ) : null}

      {mfa ? (
        <>
          <label className={label}>
            {mfaMethod === "sms" ? "SMS code" : "Authenticator code"}
            <input
              className={field}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </label>
          {mfaMethod === "sms" ? (
            <p className="mt-2 text-xs text-[#5b6573]">
              Code sent to {maskedMobile || "your mobile"}
              {demoCode ? (
                <>
                  . Demo code: <span className="font-mono font-semibold">{demoCode}</span> (also in
                  Demo inbox)
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#5b6573]">
              Demo accounts share authenticator secret <span className="font-mono">{DEMO_MFA_SECRET}</span>
              {demoCode ? (
                <>
                  . Current demo code: <span className="font-mono font-semibold">{demoCode}</span>
                </>
              ) : null}
            </p>
          )}
          {mfaMethod === "sms" ? (
            <button
              type="button"
              disabled={busy}
              className="mt-2 text-sm text-teal-900 underline-offset-2 hover:underline"
              onClick={async () => {
                setBusy(true);
                setError("");
                const res = await fetch("/api/auth/mfa", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ resend: true }),
                });
                const data = await res.json();
                setBusy(false);
                if (!res.ok) {
                  setError(data.error ?? "Could not resend code.");
                  return;
                }
                setDemoCode(data.demoCode ?? "");
                if (data.demoCode) setCode(data.demoCode);
                if (data.maskedMobile) setMaskedMobile(data.maskedMobile);
              }}
            >
              Resend SMS code
            </button>
          ) : null}
        </>
      ) : mode === "create" ? (
        <>
          <label className={label}>
            Practice name
            <input
              required
              className={field}
              value={practiceName}
              autoComplete="organization"
              placeholder="Start typing your practice name"
              onChange={(e) => {
                setPracticeName(e.target.value);
                setExistingPractice(null);
                setShowPracticeSuggestions(true);
                setShowClaimForm(false);
                setClaimMessage("");
                setError("");
              }}
              onFocus={() => setShowPracticeSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowPracticeSuggestions(false);
              }}
            />
          </label>
          <label className={`mt-4 ${label}`}>
            ZIP code
            <input
              required
              className={field}
              value={postalCode}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="e.g. 04101"
              onChange={(e) => {
                setPostalCode(e.target.value);
                setExistingPractice(null);
                setShowClaimForm(false);
                setClaimMessage("");
                setError("");
              }}
            />
          </label>
          <p className="mt-1 text-xs text-[#5b6573]">
            Practices are unique by name + ZIP. Same name in another ZIP is a different practice.
          </p>

          {showPracticeSuggestions && practiceName.trim().length >= 2 ? (
            <div className="mt-2 rounded-xl border border-[#d8d0c2] bg-white p-2" aria-label="Matching practices">
              {practiceChecking ? (
                <p className="px-2 py-1.5 text-sm text-[#5b6573]">Checking practice name…</p>
              ) : practiceMatches.length ? (
                <>
                  <p className="px-2 py-1 text-xs text-[#5b6573]">
                    {practiceMatches.length > 1
                      ? "Multiple practices share this name — choose the correct ZIP:"
                      : "Matching practice:"}
                  </p>
                  {practiceMatches.map((match) => (
                    <button
                      type="button"
                      key={match.id}
                      className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-[#efe8dc]"
                      onClick={() => selectPractice(match)}
                    >
                      <span className="font-medium text-[#0f1c2e]">
                        {match.label ||
                          `${match.name} · ${match.postalCodeDisplay || formatZipDisplay(match.postalCode)}`}
                      </span>
                      {match.admin ? (
                        <span className="mt-0.5 block text-xs text-[#5b6573]">
                          Practice admin: {match.admin.name}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </>
              ) : (
                <p className="px-2 py-1.5 text-sm text-[#5b6573]">
                  No existing practice with this name. Continue with a ZIP to create it.
                </p>
              )}
            </div>
          ) : null}

          {existingPractice ? (
            <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 px-5 py-5 text-orange-950">
              <p className="text-lg leading-snug">
                <span className="font-semibold">“{existingPractice.name}”</span>
                {" · "}
                <span className="font-semibold">
                  {existingPractice.postalCodeDisplay || formatZipDisplay(existingPractice.postalCode)}
                </span>{" "}
                already exists.
              </p>
              <p className="mt-3 text-base leading-relaxed">
                Contact this practice’s administrator (they can send you an invite):
              </p>
              {existingPractice.admin ? (
                <div className="mt-4">
                  <p className="text-2xl font-semibold tracking-tight text-[#0f1c2e]">
                    {existingPractice.admin.name}
                  </p>
                  <p className="mt-2 text-lg text-[#3d4a5c]">
                    {[existingPractice.admin.email, existingPractice.admin.phone]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-lg font-semibold text-[#0f1c2e]">
                  Ask your practice administrator for an invite.
                </p>
              )}

              {claimMessage ? (
                <p className="mt-4 text-sm text-teal-900">{claimMessage}</p>
              ) : showClaimForm ? (
                <div className="mt-5 space-y-3 border-t border-orange-200 pt-4">
                  <p className="text-sm text-[#3d4a5c]">
                    Tell us why this listing is incorrect. We’ll email support to review reclaiming
                    this practice name.
                  </p>
                  <label className={label}>
                    Your email
                    <input
                      required
                      type="email"
                      className={field}
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                    />
                  </label>
                  <label className={label}>
                    Your name
                    <input
                      className={field}
                      value={claimName}
                      onChange={(e) => setClaimName(e.target.value)}
                    />
                  </label>
                  <label className={label}>
                    Note
                    <textarea
                      className={`${field} min-h-20`}
                      value={claimNote}
                      onChange={(e) => setClaimNote(e.target.value)}
                      placeholder="Someone else registered our practice name / wrong admin contact…"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={claimBusy || !claimEmail.trim()}
                      onClick={() => void submitClaim()}
                      className="rounded-full bg-[#0f1c2e] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {claimBusy ? "Sending…" : "Submit claim"}
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-4 py-2 text-sm font-semibold text-[#5b6573]"
                      onClick={() => setShowClaimForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-sm">
                  <button
                    type="button"
                    className="font-semibold text-teal-900 underline underline-offset-2"
                    onClick={() => {
                      setShowClaimForm(true);
                      setClaimEmail(email);
                    }}
                  >
                    Incorrect information — Claim practice name
                  </button>
                </p>
              )}
            </div>
          ) : (
            <>
              {practiceAvailable ? (
                <p className="mt-2 text-xs text-[#3d4a5c]">
                  Practice name + ZIP is available. Enter your login details to create it.
                </p>
              ) : (
                <p className="mt-2 text-xs text-[#5b6573]">
                  Enter practice name and ZIP first. Other fields unlock when that combination is
                  available.
                </p>
              )}

              <label className={`mt-4 ${label}`}>
                Email
                <input
                  required={practiceAvailable}
                  disabled={!practiceAvailable}
                  type="email"
                  className={practiceAvailable ? field : fieldDisabled}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </label>
              <label className={`mt-4 ${label}`}>
                Password
                <input
                  required={practiceAvailable}
                  disabled={!practiceAvailable}
                  type="password"
                  minLength={10}
                  className={practiceAvailable ? field : fieldDisabled}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <p className="mt-1 text-xs text-[#5b6573]">At least 10 characters.</p>
              <label className={`mt-4 ${label}`}>
                Your credential
                <select
                  disabled={!practiceAvailable}
                  className={practiceAvailable ? field : fieldDisabled}
                  value={role}
                  onChange={(e) => setRole(e.target.value as PracticeRole)}
                >
                  <option value="physician">Physician</option>
                  <option value="app">APP (NP / PA)</option>
                  <option value="office_manager">Office staff</option>
                </select>
              </label>
              {practiceAvailable ? (
                <p className="mt-2 text-xs text-[#3d4a5c]">
                  This creates your practice and your login together. Add a logo, phone, fax, and
                  staff after you sign in.
                </p>
              ) : null}
            </>
          )}
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
              minLength={1}
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <p className="mt-2 text-right text-sm">
            <a href="/forgot-password" className="text-teal-900 underline-offset-2 hover:underline">
              Forgot password?
            </a>
          </p>
        </>
      )}

      {error ? <p className="mt-4 text-sm text-orange-800">{error}</p> : null}
      {!mfa && mode === "signin" && params.get("reset") === "1" ? (
        <p className="mt-4 text-sm text-teal-900">Password updated. Sign in with your new password.</p>
      ) : null}

      <button
        disabled={busy || (mode === "create" && !mfa && (!practiceAvailable || !!existingPractice))}
        className="mt-6 w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy
          ? "Please wait…"
          : mfa
            ? "Verify"
            : mode === "create"
              ? existingPractice
                ? "Practice already exists"
                : "Create Login"
              : "Sign in"}
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
