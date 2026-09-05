import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PracticeSetting } from "@/components/practice-setting";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.isPracticeCreator) redirect("/settings");
  return <PracticeSetting session={session} />;
}
