import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.mustChangePassword) redirect("/password");
  if (!session.mfaEnabled) redirect("/mfa/setup");
  return (
    <AppShell session={session}>
      {children}
    </AppShell>
  );
}
