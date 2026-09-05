import type { PracticeRole, Privilege } from "./types";

export const ROLE_LABEL: Record<PracticeRole, string> = {
  physician: "Physician",
  app: "APP (NP / PA)",
  office_manager: "Office staff",
};

const matrix: Record<Privilege, PracticeRole[]> = {
  createConsult: ["physician", "app", "office_manager"],
  viewPatientIdentifiers: ["physician", "app"],
  manageUsers: ["physician", "app", "office_manager"],
  viewPracticeQueue: ["physician", "app", "office_manager"],
  viewConsultingInbox: ["physician", "app", "office_manager"],
};

export function can(role: PracticeRole | null | undefined, privilege: Privilege): boolean {
  if (!role) return privilege === "viewConsultingInbox";
  return matrix[privilege].includes(role);
}

export function displayName(first: string, last: string, fallback = "Clinician"): string {
  return `${first} ${last}`.trim() || fallback;
}

export function clinicianPublicLabel(first: string, last: string, npi?: string | null): string {
  const name = displayName(first, last);
  return npi ? `${name} (NPI ${npi})` : name;
}
