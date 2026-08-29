import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

const nav = [
  { href: "/pcp", label: "Today" },
  { href: "/pcp/referrals/new", label: "New referral", privilege: "CREATE_REFERRAL" as const },
  { href: "/pcp/referrals", label: "Outbound referrals" },
  { href: "/pcp/analytics", label: "Referral pattern", privilege: "VIEW_ANALYTICS" as const },
  { href: "/pcp/alerts", label: "Alert settings", privilege: "MANAGE_ALERTS" as const },
  { href: "/pcp/team", label: "Team", privilege: "MANAGE_TEAM" as const },
];

export default async function PcpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("PCP");
  return (
    <AppShell user={user} nav={nav} eyebrow="Primary care">
      {children}
    </AppShell>
  );
}
