import type { ReferralStatus, Role, Urgency } from "./types";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function statusLabel(status: ReferralStatus) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "SUBMITTED":
      return "Submitted";
    case "ALERTED":
      return "Specialist notified";
    case "ACCEPTED":
      return "Accepted";
    case "SCHEDULED":
      return "Scheduled";
    case "COMPLETED":
      return "Completed";
    case "DECLINED":
      return "Declined";
  }
}

export function urgencyLabel(urgency: Urgency) {
  switch (urgency) {
    case "ROUTINE":
      return "Routine";
    case "SOON":
      return "Soon";
    case "URGENT":
      return "Urgent";
  }
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function clinicianName(name: string, credentials: string) {
  return credentials === "MD" || credentials === "DO"
    ? `Dr. ${name}`
    : `${name}, ${credentials}`;
}

export function roleShort(role: Role) {
  switch (role) {
    case "MD":
      return "MD";
    case "MIDLEVEL":
      return "APP";
    case "OFFICE_MANAGER":
      return "OM";
    case "STAFF":
      return "Staff";
  }
}
