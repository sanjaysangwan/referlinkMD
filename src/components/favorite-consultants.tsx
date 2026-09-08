"use client";

import { useCallback, useEffect, useState } from "react";
import { PhoneField, MobilePhoneText } from "@/components/phone-field";
import { formatPhone } from "@/lib/phone";

type Favorite = {
  id: string;
  firstName: string;
  lastName: string;
  mobilePhone: string | null;
};

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base text-[#0f1c2e]";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

export function FavoriteConsultantsManager() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/favorites");
    if (!res.ok) return;
    const data = await res.json();
    setFavorites(data.favorites ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add favorite.");
      return;
    }
    setOk(data.message ?? "Added.");
    setName("");
    setPhone("");
    await load();
  }

  async function remove(id: string) {
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not remove favorite.");
      return;
    }
    setOk("Removed from favorites.");
    await load();
  }

  return (
    <section className="sans chart-card space-y-4 p-6">
      <div>
        <h2 className="font-serif text-xl">Favorite consultants</h2>
        <p className="mt-1 text-sm text-[#5b6573]">
          Save a doctor by name and mobile. They are only texted when you request a consult for them.
        </p>
      </div>

      <form onSubmit={add} className="space-y-3">
        <label className={label}>
          Name
          <input
            required
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="David Okonkwo, MD"
          />
        </label>
        <label className={label}>
          Mobile
          <div className="mt-1">
            <PhoneField mobile required value={phone} onChange={setPhone} />
          </div>
        </label>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        {ok ? <p className="text-sm text-teal-900">{ok}</p> : null}
        <button
          disabled={busy}
          className="rounded-full bg-[#0f1c2e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Add to favorites"}
        </button>
      </form>

      {favorites.length ? (
        <ul className="divide-y divide-[#ebe4d8] border-t border-[#ebe4d8]">
          {favorites.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-[#0f1c2e]">
                  {f.firstName} {f.lastName}
                </p>
                {f.mobilePhone ? (
                  <MobilePhoneText
                    className="mt-0.5 text-xs text-[#5b6573]"
                    phone={formatPhone(f.mobilePhone)}
                  />
                ) : null}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(f.id)}
                className="text-sm text-orange-900 underline-offset-2 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#5b6573]">No favorite consultants yet.</p>
      )}
    </section>
  );
}
