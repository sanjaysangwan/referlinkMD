import { redirect } from "next/navigation";
import { RolePill } from "@/components/pills";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { clinicianName } from "@/lib/format";
import { can, privilegeLabel, privilegesFor, roleLabel } from "@/lib/rbac";
import type { OrgType } from "@/lib/types";

export default async function TeamPage({ orgType }: { orgType: OrgType }) {
  const user = await requireUser(orgType);
  if (!can(user, "MANAGE_TEAM")) {
    redirect(orgType === "PCP" ? "/pcp" : "/specialist");
  }
  const members = db.users().filter((u) => u.organizationId === user.organizationId);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-harbor">Directory</p>
        <h1 className="mt-2 text-4xl">Team and privileges</h1>
        <p className="mt-2 text-ink-soft">
          Office managers can see who holds which door. Role changes in production would go
          through identity (SSO / NPI-backed directory). This phase is the matrix.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-line bg-white">
        {members.map((m) => (
          <div key={m.id} className="border-b border-line px-5 py-4 last:border-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{clinicianName(m.name, m.credentials)}</div>
                <div className="text-sm text-ink-soft">{m.email}</div>
              </div>
              <RolePill label={roleLabel(m.role)} />
            </div>
            <ul className="mt-2 flex flex-wrap gap-2">
              {privilegesFor(orgType, m.role).map((p) => (
                <li key={p} className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] text-ink-soft">
                  {privilegeLabel(p)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
