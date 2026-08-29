import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

const nav = [
  { href: "/specialist", label: "Inbound queue" },
  { href: "/specialist/referrals", label: "Referral pool" },
  { href: "/specialist/analytics", label: "Pool analytics", privilege: "VIEW_ANALYTICS" as const },
  { href: "/specialist/alerts", label: "Text & phone alerts", privilege: "MANAGE_ALERTS" as const },
  { href: "/specialist/team", label: "Team", privilege: "MANAGE_TEAM" as const },
];

export default async function SpecialistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("SPECIALIST");
  return (
    <AppShell user={user} nav={nav} eyebrow="Specialty care">
      {children}
    </AppShell>
  );
}
