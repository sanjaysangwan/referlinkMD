import type { OrgType, Privilege, Role, SessionUser } from "./types";

const PCP_PRIVILEGES: Record<Role, Privilege[]> = {
  MD: [
    "CREATE_REFERRAL",
    "VIEW_CLINICAL",
    "VIEW_ANALYTICS",
    "VIEW_PRACTICE_ANALYTICS",
    "MANAGE_ALERTS",
  ],
  MIDLEVEL: [
    "CREATE_REFERRAL",
    "VIEW_CLINICAL",
    "VIEW_ANALYTICS",
    "MANAGE_ALERTS",
  ],
  OFFICE_MANAGER: [
    "VIEW_ANALYTICS",
    "VIEW_PRACTICE_ANALYTICS",
    "MANAGE_TEAM",
    "MANAGE_ALERTS",
    "VIEW_ALERT_LOG",
  ],
  STAFF: ["CREATE_REFERRAL"],
};

const SPECIALIST_PRIVILEGES: Record<Role, Privilege[]> = {
  MD: [
    "VIEW_CLINICAL",
    "ACCEPT_REFERRAL",
    "SCHEDULE_REFERRAL",
    "VIEW_ANALYTICS",
    "VIEW_PRACTICE_ANALYTICS",
    "MANAGE_ALERTS",
    "MANAGE_BILLING",
    "VIEW_ALERT_LOG",
  ],
  MIDLEVEL: [
    "VIEW_CLINICAL",
    "ACCEPT_REFERRAL",
    "SCHEDULE_REFERRAL",
    "VIEW_ANALYTICS",
    "MANAGE_ALERTS",
  ],
  OFFICE_MANAGER: [
    "SCHEDULE_REFERRAL",
    "VIEW_ANALYTICS",
    "VIEW_PRACTICE_ANALYTICS",
    "MANAGE_TEAM",
    "MANAGE_ALERTS",
    "MANAGE_BILLING",
    "VIEW_ALERT_LOG",
  ],
  STAFF: ["SCHEDULE_REFERRAL"],
};

export function privilegesFor(orgType: OrgType, role: Role): Privilege[] {
  return orgType === "PCP" ? PCP_PRIVILEGES[role] : SPECIALIST_PRIVILEGES[role];
}

export function can(user: SessionUser, privilege: Privilege): boolean {
  return user.privileges.includes(privilege);
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "MD":
      return "Physician";
    case "MIDLEVEL":
      return "Midlevel";
    case "OFFICE_MANAGER":
      return "Office manager";
    case "STAFF":
      return "Staff";
  }
}

export function privilegeLabel(privilege: Privilege): string {
  switch (privilege) {
    case "CREATE_REFERRAL":
      return "Create and send referrals";
    case "VIEW_CLINICAL":
      return "View clinical summaries";
    case "VIEW_ANALYTICS":
      return "Personal referral analytics";
    case "VIEW_PRACTICE_ANALYTICS":
      return "Practice-wide analytics";
    case "MANAGE_TEAM":
      return "Manage team and roles";
    case "MANAGE_ALERTS":
      return "Configure SMS and phone alerts";
    case "ACCEPT_REFERRAL":
      return "Accept or decline referrals";
    case "SCHEDULE_REFERRAL":
      return "Schedule incoming referrals";
    case "VIEW_ALERT_LOG":
      return "View alert delivery log";
    case "MANAGE_BILLING":
      return "Manage practice subscription";
  }
}

export const DEMO_PASSWORD = "ReferLinkDemo1!";

export const DEMO_ACCOUNTS = {
  pcp: [
    {
      email: "elena.vasquez@riverside.health",
      name: "Elena Vasquez",
      credentials: "MD",
      role: "MD" as const,
      note: "Full clinical access and practice analytics",
    },
    {
      email: "jordan.hale@riverside.health",
      name: "Jordan Hale",
      credentials: "PA-C",
      role: "MIDLEVEL" as const,
      note: "Create referrals and view own patterns",
    },
    {
      email: "priya.shah@riverside.health",
      name: "Priya Shah",
      credentials: "CMPE",
      role: "OFFICE_MANAGER" as const,
      note: "Team, operations, and practice analytics",
    },
    {
      email: "marcus.chen@riverside.health",
      name: "Marcus Chen",
      credentials: "CMA",
      role: "STAFF" as const,
      note: "Send referrals; no analytics or clinical notes",
    },
  ],
  specialist: [
    {
      email: "nathan.cole@summitcardio.health",
      name: "Nathan Cole",
      credentials: "MD",
      role: "MD" as const,
      note: "Review pool, accept cases, full analytics",
    },
    {
      email: "avery.kim@summitcardio.health",
      name: "Avery Kim",
      credentials: "NP",
      role: "MIDLEVEL" as const,
      note: "Accept assigned cases and personal analytics",
    },
    {
      email: "sam.ortiz@summitcardio.health",
      name: "Sam Ortiz",
      credentials: "CMPE",
      role: "OFFICE_MANAGER" as const,
      note: "Queue, scheduling, alerts, billing, and pool analytics",
    },
    {
      email: "riley.brooks@summitcardio.health",
      name: "Riley Brooks",
      credentials: "CSR",
      role: "STAFF" as const,
      note: "Schedule visits; no clinical or analytics",
    },
    {
      email: "iris.vale@riverbendpulm.health",
      name: "Iris Vale",
      credentials: "MD",
      role: "MD" as const,
      note: "Trial ended — paywall until $49/month",
    },
  ],
} as const;
