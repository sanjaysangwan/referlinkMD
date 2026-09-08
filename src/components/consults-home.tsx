"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FavoriteConsultantsPicker } from "@/components/favorite-consultants-picker";
import { NewConsultForm, type NewConsultFormHandle } from "@/components/new-consult-form";
import { MobilePhoneText } from "@/components/phone-field";
import { formatPhone, formatPhoneInput } from "@/lib/phone";

type WaitingRow = {
  id: string;
  createdAt: string;
  status: string;
  requestedBy: string;
  practiceName: string;
  patient: {
    firstName: string;
    lastName: string;
    dob?: string | null;
    contactPhone?: string | null;
  };
};

function WaitingList({
  rows,
  showIdentifiers,
}: {
  rows: WaitingRow[];
  showIdentifiers: boolean;
}) {
  if (!rows.length) return null;

  return (
    <section className="mb-8">
      <h2 className="text-2xl">Waiting for you</h2>
      <p className="sans mt-1 mb-4 text-sm text-[#3d4a5c]">
        Consults sent to you that still need to be resolved.
      </p>
      <ul className="sans chart-card divide-y divide-[#ebe4d8] px-4 py-1">
        {rows.map((r) => {
          const patientName = `${r.patient.firstName} ${r.patient.lastName}`.trim();
          const line2Parts = [
            r.practiceName,
            r.requestedBy || null,
            new Date(r.createdAt).toLocaleString(),
            r.status.replaceAll("_", " "),
          ].filter(Boolean);

          return (
            <li key={r.id}>
              <Link
                href={`/consults/${r.id}`}
                className="block py-3 hover:bg-[#f5f0e8] focus-visible:bg-[#f5f0e8] focus-visible:outline-none"
              >
                <p className="text-base font-medium text-teal-900">{patientName}</p>
                <p className="mt-0.5 text-sm text-[#5b6573]">
                  {showIdentifiers && r.patient.dob ? (
                    <>
                      DOB {r.patient.dob}
                      {r.patient.contactPhone ? (
                        <>
                          {" · "}
                          <MobilePhoneText phone={formatPhone(r.patient.contactPhone)} />
                        </>
                      ) : null}
                      {" · "}
                    </>
                  ) : null}
                  {line2Parts.join(" · ")}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ConsultsHome({
  showIdentifiers,
  canRequest,
  settingsHref,
}: {
  showIdentifiers: boolean;
  canRequest: boolean;
  settingsHref: string;
}) {
  const formRef = useRef<NewConsultFormHandle>(null);
  const [waiting, setWaiting] = useState<WaitingRow[] | null>(null);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formOpenTouched, setFormOpenTouched] = useState(false);
  const [inboxReady, setInboxReady] = useState(false);
  const [pendingFavorite, setPendingFavorite] = useState<{ name: string; phone: string | null } | null>(
    null,
  );

  useEffect(() => {
    function load() {
      void fetch("/api/inbox?new=1")
        .then((r) => r.json())
        .then((d) => {
          if (d.error) {
            setError(d.error);
            setInboxReady(true);
            return;
          }
          const rows = (d.consults ?? []) as WaitingRow[];
          setWaiting(rows);
          if (!formOpenTouched) {
            setFormOpen(rows.length === 0);
          }
          setInboxReady(true);
        });
    }
    load();
    const id = window.setInterval(load, 15_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [formOpenTouched]);

  useEffect(() => {
    if (!formOpen || !pendingFavorite) return;
    formRef.current?.applyFavorite(pendingFavorite);
    setPendingFavorite(null);
  }, [formOpen, pendingFavorite]);

  return (
    <>
      {error ? <p className="sans mb-6 text-sm text-orange-800">{error}</p> : null}
      {waiting ? <WaitingList rows={waiting} showIdentifiers={showIdentifiers} /> : null}

      {canRequest && inboxReady ? (
        <section>
          <h2 className="mb-3 text-2xl">Request a consult</h2>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-start">
            <FavoriteConsultantsPicker
              settingsHref={settingsHref}
              onSelect={(f) => {
                const next = {
                  name: `${f.firstName} ${f.lastName}`.trim(),
                  phone: f.mobilePhone ? formatPhoneInput(f.mobilePhone) : null,
                };
                if (!formOpen) {
                  setFormOpen(true);
                  setFormOpenTouched(true);
                  setPendingFavorite(next);
                } else {
                  formRef.current?.applyFavorite(next);
                }
              }}
            />
            <div>
              {!formOpen ? (
                <div className="sans chart-card p-5">
                  <button
                    type="button"
                    className="text-sm font-semibold text-teal-900 underline-offset-2 hover:underline"
                    onClick={() => {
                      setFormOpen(true);
                      setFormOpenTouched(true);
                    }}
                  >
                    Request a consult
                  </button>
                </div>
              ) : (
                <>
                  {waiting && waiting.length > 0 ? (
                    <button
                      type="button"
                      className="sans mb-2 text-sm text-teal-900 underline-offset-2 hover:underline"
                      onClick={() => {
                        setFormOpen(false);
                        setFormOpenTouched(true);
                      }}
                    >
                      Collapse form
                    </button>
                  ) : null}
                  <NewConsultForm ref={formRef} />
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
