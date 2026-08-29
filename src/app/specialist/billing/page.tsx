import { BillingPanel } from "@/components/billing-panel";
import { requireUser } from "@/lib/auth";

export default async function SpecialistBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; error?: string }>;
}) {
  const user = await requireUser("SPECIALIST");
  const query = await searchParams;
  return (
    <BillingPanel
      user={user}
      paid={query.paid === "1"}
      privilegeError={query.error === "privilege"}
    />
  );
}
