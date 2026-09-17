"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";
import { PracticeMark } from "@/components/practice-mark";
import { groupFavoritesBySpecialty } from "@/lib/favorite-groups";

export type FavoritePick = {
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

function FavoritePhoneLine({
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
    <span className="mt-0.5 block text-xs font-normal text-[#5b6573]">
      {office ? <span>O-{office}</span> : null}
      {office && cell ? " " : null}
      {cell ? <span>C-{cell}</span> : null}
    </span>
  );
}

function FavoriteRowContent({
  name,
  officePhone,
  mobilePhone,
  showCell,
  healthSystemName,
  healthSystemLogo,
  title,
}: {
  name: string;
  officePhone?: string | null;
  mobilePhone?: string | null;
  showCell?: boolean;
  healthSystemName?: string | null;
  healthSystemLogo?: string | null;
  title?: string;
}) {
  return (
    <span className="flex items-start gap-2">
      <PracticeMark name={healthSystemName || name} logo={healthSystemLogo} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block" title={title}>
          {name}
        </span>
        <FavoritePhoneLine officePhone={officePhone} mobilePhone={mobilePhone} showCell={showCell} />
      </span>
    </span>
  );
}

function StarToggle({
  starred,
  onToggle,
}: {
  starred?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={starred ? "Remove personal star" : "Star as personal favorite"}
      aria-pressed={Boolean(starred)}
      onClick={onToggle}
      className={`mt-0.5 shrink-0 text-base leading-none ${
        starred ? "text-teal-900" : "text-[#c4bbaa] hover:text-teal-800"
      }`}
    >
      {starred ? "★" : "☆"}
    </button>
  );
}

export function FavoriteConsultantsPicker({
  onSelect,
  settingsHref = "/directory",
}: {
  onSelect: (favorite: FavoritePick) => void;
  settingsHref?: string;
}) {
  const [favorites, setFavorites] = useState<FavoritePick[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starredOnly, setStarredOnly] = useState(false);

  useEffect(() => {
    void fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.favorites) setFavorites(d.favorites);
      })
      .catch(() => undefined);
  }, []);

  const visible = useMemo(
    () => (starredOnly ? favorites.filter((f) => f.starred) : favorites),
    [favorites, starredOnly],
  );
  const specialtyGroups = useMemo(() => groupFavoritesBySpecialty(visible), [visible]);

  async function toggleStar(id: string, starred: boolean) {
    const res = await fetch(`/api/favorites/${id}/star`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starred: !starred }),
    });
    if (!res.ok) return;
    setFavorites((prev) => prev.map((f) => (f.id === id ? { ...f, starred: !starred } : f)));
  }

  return (
    <aside className="sans chart-card h-fit w-full p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-lg">Consultant directory</h3>
        <button
          type="button"
          aria-pressed={starredOnly}
          onClick={() => setStarredOnly((v) => !v)}
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            starredOnly ? "bg-teal-900 text-white" : "bg-[#efe8dc] text-teal-900"
          }`}
        >
          {starredOnly ? "All" : "☆ Personal Favorites"}
        </button>
      </div>

      {specialtyGroups.length ? (
        <div className="mt-3 space-y-4">
          {specialtyGroups.map((group) => (
            <div key={group.specialty}>
              <p className="sans px-1 text-[11px] font-semibold tracking-wide text-[#5b6573] uppercase">
                {group.specialty}
              </p>
              <ul className="mt-1 -mx-2 divide-y divide-[#ebe4d8]">
                {group.consultants.map((f) => {
                  const name = `${f.firstName} ${f.lastName}`.trim();
                  const hasCell = Boolean(f.mobilePhone);
                  const selected = selectedId === f.id;
                  if (hasCell) {
                    return (
                      <li key={f.id} className="flex items-start gap-1 py-1 first:pt-0 last:pb-0">
                        <div className="pt-2.5 pl-3">
                          <StarToggle
                            starred={f.starred}
                            onToggle={() => void toggleStar(f.id, Boolean(f.starred))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(f.id);
                            onSelect(f);
                          }}
                          aria-pressed={selected}
                          className={`min-w-0 flex-1 rounded-lg px-2 py-2.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:bg-[#f5f0e8] hover:bg-[#f5f0e8] ${
                            selected ? "bg-[#f5f0e8] text-teal-900" : "text-[#0f1c2e]"
                          }`}
                        >
                          <FavoriteRowContent
                            name={name}
                            officePhone={f.officePhone}
                            mobilePhone={f.mobilePhone}
                            showCell
                            healthSystemName={f.healthSystemName}
                            healthSystemLogo={f.healthSystemLogo}
                            title="Click to view cell phone or send text"
                          />
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li
                      key={f.id}
                      className="flex items-start gap-1 px-3 py-2.5 text-sm text-[#5b6573]"
                    >
                      <StarToggle
                        starred={f.starred}
                        onToggle={() => void toggleStar(f.id, Boolean(f.starred))}
                      />
                      <div className="min-w-0 flex-1">
                        <FavoriteRowContent
                          name={name}
                          officePhone={f.officePhone}
                          healthSystemName={f.healthSystemName}
                          healthSystemLogo={f.healthSystemLogo}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {!favorites.length ? (
        <p className="sans mt-2 text-sm text-[#5b6573]">No consultants in the practice directory yet.</p>
      ) : null}
      {favorites.length && starredOnly && !visible.length ? (
        <p className="sans mt-2 text-sm text-[#5b6573]">No starred consultants. Tap ★ on a row.</p>
      ) : null}

      <p className={`text-sm ${favorites.length ? "mt-3" : "mt-2"}`}>
        <Link href={settingsHref} className="text-teal-900 underline-offset-2 hover:underline">
          Manage directory
        </Link>
      </p>
    </aside>
  );
}
