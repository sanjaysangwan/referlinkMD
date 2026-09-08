"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export default function ConsultLinkPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "signup" | "login" | "error">("loading");
  const [error, setError] = useState("");
  const [consultingName, setConsultingName] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    npi: "",
    password: "",
  });

  useEffect(() => {
    void (async () => {
      const r = await fetch(`/api/c/${params.token}`);
      const d = await r.json();
      if (d.error) {
        setError(d.error);
        setState("error");
        return;
      }
      setConsultingName(d.consultingName ?? "");
      if (d.prefillFirstName || d.prefillLastName) {
        setForm((f) => ({
          ...f,
          firstName: d.prefillFirstName || f.firstName,
          lastName: d.prefillLastName || f.lastName,
        }));
      }
      if (!d.needsSignup && d.consultId) {
        const view = await fetch(`/api/consults/${d.consultId}`);
        if (view.ok) {
          router.replace(`/consults/${d.consultId}`);
          return;
        }
      }
      setState(d.needsSignup ? "signup" : "login");
    })();
  }, [params.token, router]);

  async function signup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/c/${params.token}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create account.");
      return;
    }
    router.push(data.next ? `/mfa/setup?next=${encodeURIComponent(data.next)}` : data.home ?? "/mfa/setup");
    router.refresh();
  }

  if (state === "loading") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="sans text-sm text-[#5b6573]">Checking secure link…</p>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-3xl">Link unavailable</h1>
        <p className="sans mt-3 text-[#3d4a5c]">{error}</p>
      </main>
    );
  }

  if (state === "login") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-3xl">Sign in to view this consult</h1>
        <p className="sans mt-3 text-[#3d4a5c]">
          Patient details are shown only after you confirm your login. This message was addressed to{" "}
          {consultingName || "the consulting clinician"}.
        </p>
        <Link
          href={`/login?next=/c/${params.token}`}
          className="sans mt-8 inline-block rounded-full bg-teal-800 px-6 py-3 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-3xl">Create your clinician account</h1>
      <p className="sans mt-3 text-[#3d4a5c]">
        Minimum details: name, email, NPI, and password. Your mobile number is already verified by
        this secure link. Patient information is not shown until setup is complete.
      </p>
      <form onSubmit={signup} className="sans chart-card mt-8 space-y-4 p-8">
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            First name
            <input required className={field} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </label>
          <label className={label}>
            Last name
            <input required className={field} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </label>
        </div>
        <label className={label}>
          Email
          <input required type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className={label}>
          NPI
          <input required className={field} value={form.npi} onChange={(e) => setForm({ ...form, npi: e.target.value })} />
        </label>
        <label className={label}>
          Password (min 10 characters)
          <input required type="password" minLength={10} className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        <button disabled={busy} className="w-full rounded-full bg-[#0f1c2e] py-3 text-sm font-semibold text-white">
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
