import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { NewReferralForm } from "./new-referral-form";

export default async function NewReferralPage() {
  const user = await requireUser("PCP");
  if (!can(user, "CREATE_REFERRAL")) redirect("/pcp");

  const patients = db.patientsForOrg(user.organizationId);
  const specialists = db.specialistOrganizations();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">New outbound</p>
        <h1 className="mt-2 text-4xl">Refer a patient</h1>
        <p className="mt-2 text-ink-soft">
          On send, ReferLink texts — and can call — the specialist practice according to their alert settings.
        </p>
      </div>
      <NewReferralForm
        patients={patients}
        specialists={specialists}
        showClinical={can(user, "VIEW_CLINICAL")}
      />
    </div>
  );
}
