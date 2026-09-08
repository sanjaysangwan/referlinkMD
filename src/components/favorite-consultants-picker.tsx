"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/phone";

export type FavoritePick = {
  id: string;
  firstName: string;
  lastName: string;
  mobilePhone: string | null;
};

export function FavoriteConsultantsPicker({
  onSelect,
  settingsHref = "/settings",
}: {
  onSelect: (favorite: FavoritePick) => void;
  settingsHref?: string;
}) {
  const [favorites, setFavorites] = useState<FavoritePick[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/favorites")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.favorites) setFavorites(d.favorites);
      })
      .catch(() => undefined);
  }, []);

  return (
    <aside className="sans chart-card h-fit p-5">
      <h3 className="font-serif text-lg">Favorite consultants</h3>
      {favorites.length ? (
        <ul className="mt-3 -mx-2">
          {favorites.map((f) => {
            const name = `${f.firstName} ${f.lastName}`.trim();
            const phoneLabel = f.mobilePhone ? formatPhone(f.mobilePhone) : undefined;
            const selected = selectedId === f.id;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(f.id);
                    onSelect(f);
                  }}
                  title={phoneLabel}
                  aria-pressed={selected}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium focus-visible:outline-none focus-visible:bg-[#f5f0e8] hover:bg-[#f5f0e8] ${
                    selected ? "bg-[#f5f0e8] text-teal-900" : "text-[#0f1c2e]"
                  }`}
                >
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className={`text-sm ${favorites.length ? "mt-3" : "mt-2"}`}>
        <Link href={settingsHref} className="text-teal-900 underline-offset-2 hover:underline">
          Add favorite
        </Link>
      </p>
    </aside>
  );
}
