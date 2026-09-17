"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PhoneField, MobilePhoneText } from "@/components/phone-field";
import { PracticeMark } from "@/components/practice-mark";
import { formatPhone, formatPhoneInput } from "@/lib/phone";

type Favorite = {
  id: string;
  firstName: string;
  lastName: string;
  mobilePhone: string | null;
  officePhone?: string | null;
  healthSystemName?: string | null;
  healthSystemLogo?: string | null;
  specialtyLabel?: string | null;
  starred?: boolean;
};

type ConsultantMatch = {
  id: string;
  firstName: string;
  lastName: string;
  mobilePhone: string | null;
  officePhone?: string | null;
  npi: string | null;
};

const field = "mt-1 w-full rounded-xl border border-[#d8d0c2] bg-white px-3 py-2 text-base text-[#0f1c2e]";
const label = "block text-xs font-semibold tracking-wide text-[#5b6573] uppercase";

function FavoritePhones({
  officePhone,
  mobilePhone,
  showCell,
}: {
  officePhone?: string | null;
  mobilePhone?: string | null;
  showCell?: boolean;
}) {
  const office = officePhone ? formatPhone(officePhone) : "";
  const cell = showCell && mobilePhone ? formatPhone(mobilePhone) : "";
  if (!office && !cell) return null;
  return (
    <p className="mt-0.5 text-xs font-normal text-[#5b6573]">
      {office ? <span>O-{office}</span> : null}
      {office && cell ? " " : null}
      {cell ? <span>C-{cell}</span> : null}
    </p>
  );
}

export function FavoriteConsultantsManager() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [starredOnly, setStarredOnly] = useState(false);
  const [name, setName] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [matches, setMatches] = useState<ConsultantMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");

  const visible = useMemo(
    () => (starredOnly ? favorites.filter((f) => f.starred) : favorites),
    [favorites, starredOnly],
  );
  const withCell = visible.filter((f) => Boolean(f.mobilePhone));
  const officeOnly = visible.filter((f) => !f.mobilePhone && Boolean(f.officePhone));

  const load = useCallback(async () => {
    const res = await fetch("/api/favorites");
    if (!res.ok) return;
    const data = await res.json();
    setFavorites(data.favorites ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!searching || name.trim().length < 2) {
      setMatches([]);
      setSearchStatus("");
      return;
    }
    const controller = new AbortController();
    setMatches([]);
    setSearchStatus("Searching…");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          "/api/consultants?q=" + encodeURIComponent(name.trim()),
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        if (controller.signal.aborted) return;
        setMatches(data.consultants ?? []);
        setSearchStatus(
          data.consultants?.length
            ? "Select a consultant to fill their phones."
            : "No match. Enter office and/or cell below.",
        );
      } catch {
        if (!controller.signal.aborted) {
          setSearchStatus("Search unavailable. You can enter details manually.");
        }
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [name, searching]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!officePhone.trim() && !mobilePhone.trim()) {
      setError("Enter at least one phone number (office or cell).");
      return;
    }
    const officeDigits = officePhone.replace(/\D/g, "");
    const mobileDigits = mobilePhone.replace(/\D/g, "");
    if (officePhone.trim() && officeDigits.length !== 10) {
      setError("Office phone must be a 10-digit US number.");
      return;
    }
    if (mobilePhone.trim() && mobileDigits.length !== 10) {
      setError("Cell phone must be a 10-digit US number.");
      return;
    }
    setBusy(true);
    setError("");
    setOk("");
    setSearching(false);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, officePhone, mobilePhone }),
      });
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) {
        setError(data.error ?? "Could not add to the directory.");
        return;
      }
      setOk(data.message ?? "Added.");
      setName("");
      setOfficePhone("");
      setMobilePhone("");
      setMatches([]);
      setSearchStatus("");
      await load();
    } catch {
      setBusy(false);
      setError("Could not add to the directory. Check your connection and try again.");
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError("");
    setOk("");
    const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not remove from the directory.");
      return;
    }
    setOk("Removed from the practice directory.");
    await load();
  }

  async function toggleStar(id: string, starred: boolean) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/favorites/${id}/star`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !starred }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update star.");
      return;
    }
    setFavorites((prev) => prev.map((f) => (f.id === id ? { ...f, starred: !starred } : f)));
  }

  function selectMatch(person: ConsultantMatch) {
    setName(`${person.firstName} ${person.lastName}`.trim());
    setMobilePhone(formatPhoneInput(person.mobilePhone ?? ""));
    setOfficePhone(formatPhoneInput(person.officePhone ?? ""));
    setSearching(false);
    setMatches([]);
    setSearchStatus("");
  }

  function FavoriteRow({ f }: { f: Favorite }) {
    return (
      <li className="flex items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <button
            type="button"
            disabled={busy}
            aria-label={f.starred ? "Remove personal star" : "Star as personal favorite"}
            aria-pressed={Boolean(f.starred)}
            onClick={() => void toggleStar(f.id, Boolean(f.starred))}
            className={`mt-0.5 shrink-0 text-lg leading-none ${
              f.starred ? "text-teal-900" : "text-[#c4bbaa] hover:text-teal-800"
            }`}
          >
            {f.starred ? "★" : "☆"}
          </button>
          <PracticeMark
            name={f.healthSystemName || `${f.firstName} ${f.lastName}`}
            logo={f.healthSystemLogo}
            size={32}
          />
          <div className="min-w-0">
            <p className="font-medium text-[#0f1c2e]">
              {f.firstName} {f.lastName}
            </p>
            {f.specialtyLabel ? (
              <p className="mt-0.5 text-xs font-normal text-[#5b6573]">{f.specialtyLabel}</p>
            ) : null}
            <FavoritePhones
              officePhone={f.officePhone}
              mobilePhone={f.mobilePhone}
              showCell={Boolean(f.mobilePhone)}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove(f.id)}
          className="shrink-0 text-sm text-orange-900 underline-offset-2 hover:underline"
        >
          Remove
        </button>
      </li>
    );
  }

  return (
    <section className="sans chart-card space-y-4 p-6">
      <div>
        <h2 className="font-serif text-xl">Consultant directory</h2>
        <p className="mt-1 text-sm text-[#5b6573]">
          Add consultants by name with office and/or cell. At least one phone is required. Cell
          numbers can populate a new consult request.
        </p>
      </div>

      <form onSubmit={add} noValidate className="space-y-3">
        <label className={label}>
          Name
          <input
            required
            className={field}
            value={name}
            autoComplete="off"
            onChange={(e) => {
              setName(e.target.value);
              setOfficePhone("");
              setMobilePhone("");
              setSearching(true);
            }}
            onFocus={() => {
              if (name.trim().length >= 2) setSearching(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearching(false);
            }}
            placeholder="David Okonkwo, MD"
          />
        </label>
        {searching && name.trim().length >= 2 ? (
          <div className="rounded-xl border border-[#d8d0c2] bg-white p-2" aria-label="Matching consultants">
            {matches.map((person) => (
              <button
                type="button"
                key={person.id}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-teal-50 focus:bg-teal-50"
                onClick={() => selectMatch(person)}
              >
                <span className="block font-semibold">
                  {person.firstName} {person.lastName}
                </span>
                {person.officePhone || person.mobilePhone ? (
                  <span className="text-xs text-gray-600">
                    {person.officePhone ? <>O-{formatPhoneInput(person.officePhone)} </> : null}
                    {person.mobilePhone ? (
                      <MobilePhoneText phone={formatPhoneInput(person.mobilePhone)} />
                    ) : null}
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">No phone on file</span>
                )}
              </button>
            ))}
            <p role="status" className="px-3 py-2 text-sm text-gray-600">
              {searchStatus}
            </p>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={label}>
            Office
            <div className="mt-1">
              <PhoneField value={officePhone} onChange={setOfficePhone} />
            </div>
          </label>
          <label className={label}>
            Cell
            <div className="mt-1">
              <PhoneField mobile value={mobilePhone} onChange={setMobilePhone} />
            </div>
          </label>
        </div>
        <p className="text-xs text-[#5b6573]">Enter at least one phone number.</p>
        {error ? <p className="text-sm text-orange-800">{error}</p> : null}
        {ok ? <p className="text-sm text-teal-900">{ok}</p> : null}
        <button
          disabled={busy}
          className="rounded-full bg-[#0f1c2e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Add to directory"}
        </button>
      </form>

      {favorites.length ? (
        <div className="space-y-4 border-t border-[#ebe4d8] pt-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-pressed={starredOnly}
              onClick={() => setStarredOnly((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                starredOnly ? "bg-teal-900 text-white" : "bg-[#efe8dc] text-teal-900"
              }`}
            >
              {starredOnly ? "All" : "☆ Personal Favorites"}
            </button>
            <p className="text-xs text-[#5b6573]">
              {starredOnly ? "Showing your starred list" : "Showing full practice directory"}
            </p>
          </div>
          {withCell.length ? (
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-[#5b6573] uppercase">
                With cell phone
              </p>
              <ul className="divide-y divide-[#ebe4d8]">
                {withCell.map((f) => (
                  <FavoriteRow key={f.id} f={f} />
                ))}
              </ul>
            </div>
          ) : null}
          {officeOnly.length ? (
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-[#5b6573] uppercase">
                Office phones only
              </p>
              <ul className="divide-y divide-[#ebe4d8]">
                {officeOnly.map((f) => (
                  <FavoriteRow key={f.id} f={f} />
                ))}
              </ul>
            </div>
          ) : null}
          {starredOnly && !visible.length ? (
            <p className="text-sm text-[#5b6573]">No starred consultants yet. Tap ★ on a row.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[#5b6573]">No consultants in the practice directory yet.</p>
      )}
    </section>
  );
}
