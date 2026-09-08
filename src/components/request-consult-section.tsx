"use client";

import { useRef } from "react";
import { FavoriteConsultantsPicker } from "@/components/favorite-consultants-picker";
import { NewConsultForm, type NewConsultFormHandle } from "@/components/new-consult-form";
import { formatPhoneInput } from "@/lib/phone";

export function RequestConsultSection({ settingsHref }: { settingsHref: string }) {
  const formRef = useRef<NewConsultFormHandle>(null);

  return (
    <section>
      <h2 className="mb-3 text-2xl">Request a consult</h2>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:items-start">
        <FavoriteConsultantsPicker
          settingsHref={settingsHref}
          onSelect={(f) => {
            formRef.current?.applyFavorite({
              name: `${f.firstName} ${f.lastName}`.trim(),
              phone: f.mobilePhone ? formatPhoneInput(f.mobilePhone) : null,
            });
          }}
        />
        <NewConsultForm ref={formRef} />
      </div>
    </section>
  );
}
