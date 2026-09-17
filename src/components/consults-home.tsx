"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FavoriteConsultantsPicker } from "@/components/favorite-consultants-picker";
import { NewConsultForm, type NewConsultFormHandle } from "@/components/new-consult-form";
import { BrowserTabList, BrowserTabPanel } from "@/components/browser-tabs";
import { MobilePhoneText } from "@/components/phone-field";
import { formatPhone, formatPhoneInput } from "@/lib/phone";

type WaitingRow = {
  id: string;
  createdAt: string;
  status: string;
  consultingName?: string;
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
  groupByConsultingClinician,
}: {
  rows: WaitingRow[];
  showIdentifiers: boolean;
  groupByConsultingClinician: boolean;
}) {
  if (!rows.length) return null;

  const sections = groupByConsultingClinician
    ? (() => {
        const map = new Map<string, WaitingRow[]>();
        for (const r of rows) {
          const key = (r.consultingName || "Unknown clinician").trim() || "Unknown clinician";
          const list = map.get(key) ?? [];
          list.push(r);
          map.set(key, list);
        }
        return Array.from(map.entries()).map(([title, groupRows]) => ({
          key: title,
          title,
          rows: groupRows,
        }));
      })()
    : [{ key: "all", title: null as string | null, rows }];

  return (
    <section className="mb-8">
      <h2 className="text-2xl">
        {groupByConsultingClinician ? "Waiting for your practice" : "Waiting for you"}
      </h2>
      <p className="sans mt-1 mb-4 text-sm text-[#3d4a5c]">
        {groupByConsultingClinician
          ? "Incoming consults for clinicians in your practice, grouped by consulting physician."
          : "Consults sent to you that still need to be resolved."}
      </p>
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.key}>
            {section.title ? (
              <h3 className="sans mb-2 text-sm font-semibold tracking-wide text-[#5b6573] uppercase">
                {section.title}
              </h3>
            ) : null}
            <ul className="sans chart-card divide-y divide-[#ebe4d8] px-4 py-1">
              {section.rows.map((r) => {
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
          </div>
        ))}
      </div>
    </section>
  );
}

export function ConsultsHome({
  showIdentifiers,
  canRequest,
  settingsHref,
  demoDefaults = false,
}: {
  showIdentifiers: boolean;
  canRequest: boolean;
  settingsHref: string;
  demoDefaults?: boolean;
}) {
  const formRef = useRef<NewConsultFormHandle>(null);
  const [waiting, setWaiting] = useState<WaitingRow[] | null>(null);
  const [groupByConsulting, setGroupByConsulting] = useState(false);
  const [error, setError] = useState("");
  const [homeTab, setHomeTab] = useState<"favorites" | "request">("favorites");
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
          setGroupByConsulting(Boolean(d.groupByConsultingClinician));
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
    const favorite = pendingFavorite;
    // Form may mount in this same commit; apply after ref is attached.
    const id = window.requestAnimationFrame(() => {
      formRef.current?.applyFavorite(favorite);
      setPendingFavorite(null);
    });
    return () => window.cancelAnimationFrame(id);
  }, [formOpen, pendingFavorite]);

  return (
    <>
      {error ? <p className="sans mb-6 text-sm text-orange-800">{error}</p> : null}
      {waiting ? (
        <WaitingList
          rows={waiting}
          showIdentifiers={showIdentifiers}
          groupByConsultingClinician={groupByConsulting}
        />
      ) : null}

      {canRequest && inboxReady ? (
        <section>
          <BrowserTabList
            aria-label="Home"
            activeId={homeTab}
            onChange={(id) => {
              const next = id as "favorites" | "request";
              setHomeTab(next);
              if (next === "request" && !formOpen) {
                setFormOpen(true);
                setFormOpenTouched(true);
              }
            }}
            tabs={[
              { id: "favorites", label: "Consultant directory" },
              { id: "request", label: "Consult request" },
            ]}
          />

          <div className="mt-4">
            <BrowserTabPanel id="favorites" activeId={homeTab}>
              <FavoriteConsultantsPicker
                settingsHref={settingsHref}
                onSelect={(f) => {
                  const next = {
                    name: `${f.firstName} ${f.lastName}`.trim(),
                    phone: f.mobilePhone ? formatPhoneInput(f.mobilePhone) : null,
                  };
                  setHomeTab("request");
                  setFormOpen(true);
                  setFormOpenTouched(true);
                  setPendingFavorite(next);
                }}
              />
            </BrowserTabPanel>

            <BrowserTabPanel id="request" activeId={homeTab} className="min-w-0">
              {!formOpen ? (
                <div className="sans chart-card h-fit w-full p-5">
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
                <NewConsultForm ref={formRef} demoDefaults={demoDefaults} />
              )}
            </BrowserTabPanel>
          </div>
        </section>
      ) : null}
    </>
  );
}
