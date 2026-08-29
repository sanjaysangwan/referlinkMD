import { db } from "./db";
import type { Referral, SessionUser } from "./types";

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function lastMonths(count: number) {
  const keys: string[] = [];
  const now = new Date();
  now.setDate(1);
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
}

export function scopedReferrals(user: SessionUser, scope: "self" | "practice"): Referral[] {
  if (user.organizationType === "PCP") {
    const all = db.referralsFromOrg(user.organizationId);
    if (scope === "practice") return all;
    return all.filter((r) => r.referringUserId === user.id);
  }
  const all = db.referralsToOrg(user.organizationId);
  if (scope === "practice") return all;
  return all.filter((r) => r.assignedSpecialistUserId === user.id);
}

export function buildAnalytics(referrals: Referral[]) {
  const months = lastMonths(12);
  const monthlyMap = new Map(months.map((k) => [k, 0]));
  const bySpecialty = new Map<string, number>();
  const byDestination = new Map<string, number>();
  const bySource = new Map<string, number>();
  const byStatus = new Map<string, number>();
  const byUrgency = new Map<string, number>();
  let acceptedHours = 0;
  let acceptedCount = 0;

  for (const r of referrals) {
    const key = monthKey(r.createdAt);
    if (monthlyMap.has(key)) monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + 1);
    bySpecialty.set(r.specialty, (bySpecialty.get(r.specialty) ?? 0) + 1);
    byDestination.set(
      r.specialistOrganizationId,
      (byDestination.get(r.specialistOrganizationId) ?? 0) + 1,
    );
    bySource.set(
      r.referringOrganizationId,
      (bySource.get(r.referringOrganizationId) ?? 0) + 1,
    );
    byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    byUrgency.set(r.urgency, (byUrgency.get(r.urgency) ?? 0) + 1);
    if (r.acceptedAt) {
      acceptedHours +=
        (new Date(r.acceptedAt).getTime() - new Date(r.createdAt).getTime()) /
        36e5;
      acceptedCount += 1;
    }
  }

  const closed = referrals.filter((r) =>
    ["ACCEPTED", "SCHEDULED", "COMPLETED"].includes(r.status),
  ).length;

  return {
    total: referrals.length,
    monthly: months.map((key) => ({
      key,
      label: monthLabel(key),
      count: monthlyMap.get(key) ?? 0,
    })),
    bySpecialty: [...bySpecialty.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    byDestination: [...byDestination.entries()].map(([id, count]) => ({
      id,
      count,
    })),
    bySource: [...bySource.entries()].map(([id, count]) => ({ id, count })),
    byStatus: [...byStatus.entries()].map(([name, count]) => ({ name, count })),
    byUrgency: [...byUrgency.entries()].map(([name, count]) => ({ name, count })),
    conversionRate: referrals.length ? Math.round((closed / referrals.length) * 100) : 0,
    avgHoursToAccept: acceptedCount ? Math.round(acceptedHours / acceptedCount) : 0,
    urgent: referrals.filter((r) => r.urgency === "URGENT").length,
    open: referrals.filter((r) =>
      ["SUBMITTED", "ALERTED", "ACCEPTED"].includes(r.status),
    ).length,
  };
}
