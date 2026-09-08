import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MemberProfileCard } from "@/components/member-profile-card";
import { FavoriteConsultantsManager } from "@/components/favorite-consultants";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.isPracticeCreator) redirect("/team");
  return (
    <div>
      <h1 className="text-3xl">Setting</h1>
      <p className="sans mt-2 mb-6 max-w-xl text-sm text-[#3d4a5c]">Your contact details for this practice.</p>
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2 lg:items-start">
        <MemberProfileCard session={session} />
        <FavoriteConsultantsManager />
      </div>
    </div>
  );
}
