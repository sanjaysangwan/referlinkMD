import { redirect } from "next/navigation";
import { BillingPanel } from "@/components/billing-panel";
import { requireUser } from "@/lib/auth";
import { specialistBillingEnabled } from "@/lib/billing";

export default async function SpecialistBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; error?: string }>;
}) {
  const user = await requireUser("SPECIALIST");
  if (!specialistBillingEnabled()) {
    redirect("/specialist");
  }
  const query = await searchParams;
  return (
    <BillingPanel
      user={user}
      paid={query.paid === "1"}
      privilegeError={query.error === "privilege"}
    />
  );
}
