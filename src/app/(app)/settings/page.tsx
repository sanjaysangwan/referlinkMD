import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MemberProfileCard } from "@/components/member-profile-card";
import { ChangePasswordCard } from "@/components/change-password-card";
import { LeavePracticeCard } from "@/components/leave-practice-card";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.isPracticeCreator) redirect("/team");
  if (!session.practiceId) redirect("/create-practice");
  return (
    <div>
      <h1 className="text-3xl">Setting</h1>
      <p className="sans mt-2 mb-6 max-w-xl text-sm text-muted">Your contact details for this practice.</p>
      <div className="flex w-full max-w-4xl flex-col gap-6">
        <MemberProfileCard session={session} />
        <ChangePasswordCard />
        <LeavePracticeCard practiceName={session.practiceName} />
      </div>
    </div>
  );
}
